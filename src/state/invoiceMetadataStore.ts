import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "../config/firebase";

export interface InvoiceMetadata {
  id: string;
  companyId: string;
  filename: string;
  processedAt: number;
  processedBy: string; // user ID
  itemsAdded: number;
  vendor?: string;
  invoiceNumber?: string;
  total?: number;
}

interface InvoiceMetadataState {
  processedInvoices: InvoiceMetadata[];
  unsubscribe: (() => void) | null;
  currentCompanyId: string | null;

  initializeSync: (companyId: string) => void;
  stopSync: () => void;
  markInvoiceAsProcessed: (
    filename: string,
    userId: string,
    itemsAdded: number,
    metadata?: { vendor?: string; invoiceNumber?: string; total?: number }
  ) => Promise<void>;
  isInvoiceProcessed: (filename: string) => boolean;
  getProcessedInvoices: () => InvoiceMetadata[];
}

export const useInvoiceMetadataStore = create<InvoiceMetadataState>()(
  persist(
    (set, get) => ({
      processedInvoices: [],
      unsubscribe: null,
      currentCompanyId: null,

      initializeSync: (companyId: string) => {
        // Set up real-time listener
        const invoicesRef = collection(firestore, "invoiceMetadata");
        const q = query(invoicesRef, where("companyId", "==", companyId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const invoices: InvoiceMetadata[] = [];
          snapshot.forEach((doc) => {
            invoices.push(doc.data() as InvoiceMetadata);
          });
          set({ processedInvoices: invoices });
        });

        set({ unsubscribe, currentCompanyId: companyId });
      },

      stopSync: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null, currentCompanyId: null });
        }
      },

      markInvoiceAsProcessed: async (filename, userId, itemsAdded, metadata) => {
        const { currentCompanyId } = get();
        if (!currentCompanyId) {
          throw new Error("No company ID set. Please log in first.");
        }

        const invoice: InvoiceMetadata = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          companyId: currentCompanyId,
          filename,
          processedAt: Date.now(),
          processedBy: userId,
          itemsAdded,
          vendor: metadata?.vendor,
          invoiceNumber: metadata?.invoiceNumber,
          total: metadata?.total,
        };

        // Save to Firestore
        await setDoc(doc(firestore, "invoiceMetadata", invoice.id), invoice);

        // Update local state
        set((state) => ({
          processedInvoices: [...state.processedInvoices, invoice],
        }));
      },

      isInvoiceProcessed: (filename: string) => {
        return get().processedInvoices.some((inv) => inv.filename === filename);
      },

      getProcessedInvoices: () => {
        return get().processedInvoices;
      },
    }),
    {
      name: "invoice-metadata-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
