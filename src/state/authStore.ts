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

interface AuthState {
  user: User | null;
  company: Company | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, companyName: string) => Promise<void>;
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
        onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
              } else {
                set({ user: null, company: null, isAuthenticated: false, loading: false });
              }
            } catch (error: any) {
              console.error("Error fetching user data:", error);
              set({ error: error.message, loading: false });
            }
          } else {
            set({ user: null, company: null, isAuthenticated: false, loading: false });
          }
        });
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

      signOut: async () => {
        try {
          set({ loading: true, error: null });
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
