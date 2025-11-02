import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PasswordEntry, PasswordCategory, PasswordPermission } from "../types/password";
import { encryptPassword, decryptPassword } from "../utils/encryption";

interface PasswordVaultState {
  passwords: PasswordEntry[];
  isLocked: boolean;
  lastUnlockTime: number;

  // Actions
  addPassword: (
    password: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt" | "accessCount" | "encryptedPassword"> & { plainPassword: string }
  ) => Promise<void>;
  updatePassword: (id: string, updates: Partial<Omit<PasswordEntry, "id" | "encryptedPassword">> & { plainPassword?: string }) => Promise<void>;
  deletePassword: (id: string) => void;
  getPassword: (id: string) => Promise<string | null>;
  sharePassword: (id: string, userIds: string[], permission?: PasswordPermission) => void;
  shareMultiplePasswords: (passwordIds: string[], userId: string, permission: PasswordPermission) => void;
  lockVault: () => void;
  unlockVault: () => void;
  getPasswordsByCategory: (category: PasswordCategory) => PasswordEntry[];
  searchPasswords: (query: string) => PasswordEntry[];
  logAccess: (passwordId: string, action: "viewed" | "copied" | "autofilled") => void;
}

export const usePasswordVaultStore = create<PasswordVaultState>()(
  persist(
    (set, get) => ({
      passwords: [],
      isLocked: false,
      lastUnlockTime: Date.now(),

      addPassword: async (password) => {
        const encryptedPassword = await encryptPassword(password.plainPassword);
        const newPassword: PasswordEntry = {
          ...password,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          encryptedPassword,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          accessCount: 0,
        };
        set((state) => ({ passwords: [...state.passwords, newPassword] }));
      },

      updatePassword: async (id, updates) => {
        const { plainPassword, ...otherUpdates } = updates;
        let encryptedPassword: string | undefined;

        if (plainPassword) {
          encryptedPassword = await encryptPassword(plainPassword);
        }

        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            pwd.id === id
              ? {
                  ...pwd,
                  ...otherUpdates,
                  ...(encryptedPassword && { encryptedPassword }),
                  updatedAt: Date.now(),
                }
              : pwd
          ),
        }));
      },

      deletePassword: (id) => {
        set((state) => ({
          passwords: state.passwords.filter((pwd) => pwd.id !== id),
        }));
      },

      getPassword: async (id) => {
        const password = get().passwords.find((pwd) => pwd.id === id);
        if (!password) return null;

        try {
          const decrypted = await decryptPassword(password.encryptedPassword);
          // Log access
          get().logAccess(id, "viewed");
          return decrypted;
        } catch (error) {
          console.error("Failed to decrypt password:", error);
          return null;
        }
      },

      sharePassword: (id, userIds, permission = "use") => {
        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            pwd.id === id
              ? {
                  ...pwd,
                  sharedWith: [...new Set([...pwd.sharedWith, ...userIds])],
                  sharedPermissions: {
                    ...pwd.sharedPermissions,
                    ...userIds.reduce((acc, userId) => ({ ...acc, [userId]: permission }), {}),
                  },
                  updatedAt: Date.now(),
                }
              : pwd
          ),
        }));
      },

      shareMultiplePasswords: (passwordIds, userId, permission) => {
        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            passwordIds.includes(pwd.id)
              ? {
                  ...pwd,
                  sharedWith: [...new Set([...pwd.sharedWith, userId])],
                  sharedPermissions: {
                    ...pwd.sharedPermissions,
                    [userId]: permission,
                  },
                  updatedAt: Date.now(),
                }
              : pwd
          ),
        }));
      },

      lockVault: () => {
        set({ isLocked: true });
      },

      unlockVault: () => {
        set({ isLocked: false, lastUnlockTime: Date.now() });
      },

      getPasswordsByCategory: (category) => {
        return get().passwords.filter((pwd) => pwd.category === category);
      },

      searchPasswords: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().passwords.filter(
          (pwd) =>
            pwd.title.toLowerCase().includes(lowerQuery) ||
            pwd.username?.toLowerCase().includes(lowerQuery) ||
            pwd.website?.toLowerCase().includes(lowerQuery) ||
            pwd.notes?.toLowerCase().includes(lowerQuery) ||
            pwd.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },

      logAccess: (passwordId, action) => {
        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            pwd.id === passwordId
              ? {
                  ...pwd,
                  lastAccessed: Date.now(),
                  accessCount: pwd.accessCount + 1,
                }
              : pwd
          ),
        }));
      },
    }),
    {
      name: "password-vault-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
