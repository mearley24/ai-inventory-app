import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, firestore } from "../config/firebase";
import { User, Company, UserRole } from "../types/auth";
import { usePasswordVaultStore } from "./passwordVaultStore";
import { useInventoryStore } from "./inventoryStore";
import { useInvoiceMetadataStore } from "./invoiceMetadataStore";

interface AuthState {
  user: User | null;
  company: Company | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, companyName: string) => Promise<void>;
  joinCompany: (email: string, password: string, displayName: string, companyId: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      loading: true,
      error: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCompany: (company) => set({ company }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      initializeAuth: () => {
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.log("Auth initialization timeout - setting loading to false");
          if (get().loading) {
            set({ loading: false, isAuthenticated: false });
          }
        }, 5000); // 5 second timeout

        // Check if we have cached auth data in AsyncStorage first
        const cachedAuth = get();
        if (cachedAuth.user && cachedAuth.isAuthenticated) {
          console.log("Using cached auth data (offline mode)");
          clearTimeout(timeout);
          set({ loading: false });

          // Initialize stores with cached data
          if (cachedAuth.user.companyId) {
            useInventoryStore.getState().initializeSync(cachedAuth.user.companyId);
          }
          if (cachedAuth.user.uid && cachedAuth.user.companyId) {
            usePasswordVaultStore.getState().initializeSync(cachedAuth.user.uid, cachedAuth.user.companyId);
            useInvoiceMetadataStore.getState().initializeSync(cachedAuth.user.companyId);
          }

          // Try to sync with Firebase in background (will fail silently if offline)
          setTimeout(() => {
            try {
              onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser && get().isAuthenticated) {
                  console.log("Firebase auth synced in background");
                  // Already authenticated with cached data, just update if needed
                  try {
                    const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                      const userData = userDoc.data() as User;
                      set({ user: userData });

                      if (userData.companyId) {
                        const companyDoc = await getDoc(doc(firestore, "companies", userData.companyId));
                        if (companyDoc.exists()) {
                          set({ company: companyDoc.data() as Company });
                        }
                      }
                    }
                  } catch (error) {
                    console.log("Offline: Could not sync with Firebase (using cached data)");
                  }
                }
              });
            } catch (error) {
              console.log("Firebase unavailable (offline mode) - using cached auth");
            }
          }, 100);

          return;
        }

        // No cached auth - try Firebase (online mode)
        console.log("No cached auth - checking Firebase");
        try {
          onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            clearTimeout(timeout);
            if (firebaseUser) {
              try {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));

                if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  set({ user: userData, isAuthenticated: true, loading: false });

                  // Fetch company data
                  if (userData.companyId) {
                    const companyDoc = await getDoc(doc(firestore, "companies", userData.companyId));
                    if (companyDoc.exists()) {
                      set({ company: companyDoc.data() as Company });
                    }
                  }

                  // Initialize password vault sync
                  usePasswordVaultStore.getState().initializeSync(userData.uid, userData.companyId);

                  // Initialize inventory sync
                  useInventoryStore.getState().initializeSync(userData.companyId);

                  // Initialize invoice metadata sync
                  useInvoiceMetadataStore.getState().initializeSync(userData.companyId);
                } else {
                  set({ user: null, company: null, isAuthenticated: false, loading: false });
                }
              } catch (error: any) {
                console.error("Error fetching user data:", error);
                set({ error: error.message, loading: false, isAuthenticated: false });
              }
            } else {
              // Stop password vault sync when user signs out
              usePasswordVaultStore.getState().stopSync();

              // Stop inventory sync when user signs out
              useInventoryStore.getState().stopSync();

              // Stop invoice metadata sync when user signs out
              useInvoiceMetadataStore.getState().stopSync();

              set({ user: null, company: null, isAuthenticated: false, loading: false });
            }
          });
        } catch (error) {
          console.error("Error initializing Firebase auth:", error);
          clearTimeout(timeout);
          set({ loading: false, isAuthenticated: false });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          await signInWithEmailAndPassword(auth, email, password);
          // onAuthStateChanged will handle setting the user
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, displayName: string, companyName: string) => {
        try {
          set({ loading: true, error: null });

          // Create Firebase auth user
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Create company
          const companyId = doc(collection(firestore, "companies")).id;
          const company: Company = {
            id: companyId,
            name: companyName,
            ownerId: firebaseUser.uid,
            createdAt: Date.now(),
            subscriptionTier: "free",
            settings: {
              allowFieldWorkerDelete: false,
              requireApprovalForNewItems: false,
              enableTimeTracking: true,
            },
          };

          await setDoc(doc(firestore, "companies", companyId), company);

          // Create user profile
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName,
            companyId,
            role: "owner",
            teams: [],
            createdAt: Date.now(),
            lastActive: Date.now(),
          };

          await setDoc(doc(firestore, "users", firebaseUser.uid), user);

          set({ user, company, isAuthenticated: true, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      joinCompany: async (email: string, password: string, displayName: string, companyId: string) => {
        try {
          set({ loading: true, error: null });

          // Verify the company exists
          const companyDoc = await getDoc(doc(firestore, "companies", companyId));
          if (!companyDoc.exists()) {
            throw new Error("Company not found. Please check the Company ID.");
          }

          // Create Firebase auth user
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Create user profile with the existing company
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName,
            companyId,
            role: "field_worker",
            teams: [],
            createdAt: Date.now(),
            lastActive: Date.now(),
          };

          await setDoc(doc(firestore, "users", firebaseUser.uid), user);

          const company = companyDoc.data() as Company;
          set({ user, company, isAuthenticated: true, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ loading: true, error: null });

          // Stop password vault sync
          usePasswordVaultStore.getState().stopSync();

          // Stop inventory sync
          useInventoryStore.getState().stopSync();

          // Stop invoice metadata sync
          useInvoiceMetadataStore.getState().stopSync();

          await firebaseSignOut(auth);
          set({ user: null, company: null, isAuthenticated: false, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist user and company, not loading/error states
        user: state.user,
        company: state.company,
      }),
    }
  )
);
