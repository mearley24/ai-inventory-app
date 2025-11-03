import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PasswordEntry, PasswordCategory, PasswordPermission } from "../types/password";
import { encryptPassword, decryptPassword } from "../utils/encryption";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../config/firebase";

interface PasswordVaultState {
  passwords: PasswordEntry[];
  isLocked: boolean;
  lastUnlockTime: number;
  unsubscribe: (() => void) | null;

  // Actions
  initializeSync: (userId: string, companyId: string) => void;
  stopSync: () => void;
  addPassword: (
    password: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt" | "accessCount" | "encryptedPassword"> & { plainPassword: string }
  ) => Promise<void>;
  updatePassword: (id: string, updates: Partial<Omit<PasswordEntry, "id" | "encryptedPassword">> & { plainPassword?: string }) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  getPassword: (id: string) => Promise<string | null>;
  sharePassword: (id: string, userIds: string[], permission?: PasswordPermission) => Promise<void>;
  shareMultiplePasswords: (passwordIds: string[], userId: string, permission: PasswordPermission) => Promise<void>;
  lockVault: () => void;
  unlockVault: () => void;
  getPasswordsByCategory: (category: PasswordCategory) => PasswordEntry[];
  searchPasswords: (query: string) => PasswordEntry[];
  logAccess: (passwordId: string, action: "viewed" | "copied" | "autofilled") => Promise<void>;
}

export const usePasswordVaultStore = create<PasswordVaultState>()(
  persist(
    (set, get) => ({
      passwords: [],
      isLocked: false,
      lastUnlockTime: Date.now(),
      unsubscribe: null,

      initializeSync: (userId: string, companyId: string) => {
        // Stop any existing listener
        const currentUnsub = get().unsubscribe;
        if (currentUnsub) currentUnsub();

        // Set up real-time listener for passwords user has access to
        const passwordsRef = collection(firestore, "passwords");
        const q = query(passwordsRef, where("companyId", "==", companyId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const passwords: PasswordEntry[] = [];
          const seenIds = new Set<string>(); // Track IDs to prevent duplicates

          snapshot.forEach((doc) => {
            const pwd = doc.data() as PasswordEntry;
            // Only include passwords user has access to and prevent duplicates
            if (
              !seenIds.has(pwd.id) &&
              (pwd.createdBy === userId ||
                pwd.sharedWith.includes(userId) ||
                pwd.allowedRoles.includes(userId))
            ) {
              seenIds.add(pwd.id);
              passwords.push(pwd);
            }
          });
          set({ passwords });
        });

        set({ unsubscribe });
      },

      stopSync: () => {
        const unsub = get().unsubscribe;
        if (unsub) {
          unsub();
          set({ unsubscribe: null });
        }
      },

      addPassword: async (password) => {
        const encryptedPassword = await encryptPassword(password.plainPassword);

        // Use Firestore's auto-generated ID to ensure uniqueness
        const newPasswordRef = doc(collection(firestore, "passwords"));
        const newPassword: PasswordEntry = {
          ...password,
          id: newPasswordRef.id,
          encryptedPassword,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          accessCount: 0,
        };

        // Save to Firestore (real-time listener will update local state)
        await setDoc(newPasswordRef, newPassword);

        // Don't manually update local state - let the real-time listener handle it
        // This prevents duplicate entries
      },

      updatePassword: async (id, updates) => {
        const { plainPassword, ...otherUpdates } = updates;
        let encryptedPassword: string | undefined;

        if (plainPassword) {
          encryptedPassword = await encryptPassword(plainPassword);
        }

        const updateData = {
          ...otherUpdates,
          ...(encryptedPassword && { encryptedPassword }),
          updatedAt: Date.now(),
        };

        // Update Firestore
        await updateDoc(doc(firestore, "passwords", id), updateData);

        // Update local state
        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            pwd.id === id
              ? { ...pwd, ...updateData }
              : pwd
          ),
        }));
      },

      deletePassword: async (id) => {
        // Delete from Firestore
        await deleteDoc(doc(firestore, "passwords", id));

        // Update local state
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

      sharePassword: async (id, userIds, permission = "use") => {
        const password = get().passwords.find((p) => p.id === id);
        if (!password) return;

        const updateData = {
          sharedWith: [...new Set([...password.sharedWith, ...userIds])],
          sharedPermissions: {
            ...password.sharedPermissions,
            ...userIds.reduce((acc, userId) => ({ ...acc, [userId]: permission }), {}),
          },
          updatedAt: Date.now(),
        };

        // Update Firestore
        await updateDoc(doc(firestore, "passwords", id), updateData);

        // Update local state
        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            pwd.id === id ? { ...pwd, ...updateData } : pwd
          ),
        }));
      },

      shareMultiplePasswords: async (passwordIds, userId, permission) => {
        // Update each password in Firestore
        const updatePromises = passwordIds.map(async (passwordId) => {
          const password = get().passwords.find((p) => p.id === passwordId);
          if (!password) return;

          const updateData = {
            sharedWith: [...new Set([...password.sharedWith, userId])],
            sharedPermissions: {
              ...password.sharedPermissions,
              [userId]: permission,
            },
            updatedAt: Date.now(),
          };

          await updateDoc(doc(firestore, "passwords", passwordId), updateData);
        });

        await Promise.all(updatePromises);

        // Update local state
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

      logAccess: async (passwordId, action) => {
        const password = get().passwords.find((p) => p.id === passwordId);
        if (!password) return;

        const updateData = {
          lastAccessed: Date.now(),
          accessCount: password.accessCount + 1,
        };

        // Update Firestore
        await updateDoc(doc(firestore, "passwords", passwordId), updateData);

        // Update local state
        set((state) => ({
          passwords: state.passwords.map((pwd) =>
            pwd.id === passwordId
              ? { ...pwd, ...updateData }
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
