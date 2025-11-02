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
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import { InventoryItem } from "../types/inventory";

interface InventoryState {
  items: InventoryItem[];
  unsubscribe: (() => void) | null;
  currentCompanyId: string | null;

  initializeSync: (companyId: string) => void;
  stopSync: () => void;
  addItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "companyId">) => Promise<void>;
  addItems: (items: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "companyId">[]) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearAll: () => void;
  getItemByBarcode: (barcode: string) => InventoryItem | undefined;
  getLowStockItems: () => InventoryItem[];
  toggleStarred: (id: string) => Promise<void>;
  getStarredLowStockItems: () => InventoryItem[];
  findDuplicates: () => InventoryItem[][];
  mergeDuplicates: (itemsToMerge: InventoryItem[], keepItem: InventoryItem) => Promise<void>;
  autoMergeAllDuplicates: () => Promise<{ merged: number; removed: number }>;
  bulkUpdateCategories: (updates: { id: string; category: string; subcategory?: string }[]) => Promise<void>;
  assignToProject: (itemId: string, projectId: string | undefined) => Promise<void>;
  getItemsByProject: (projectId: string) => InventoryItem[];
  unassignFromProject: (itemId: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: [],
      unsubscribe: null,
      currentCompanyId: null,

      initializeSync: (companyId: string) => {
        // First, migrate any existing items that don't have a companyId
        const existingItems = get().items;
        const itemsToMigrate = existingItems.filter((item) => !item.companyId);

        if (itemsToMigrate.length > 0) {
          console.log(`Migrating ${itemsToMigrate.length} items to Firestore with companyId...`);

          // Add companyId to existing items and upload to Firestore
          Promise.all(
            itemsToMigrate.map(async (item) => {
              const updatedItem = { ...item, companyId };
              await setDoc(doc(firestore, "inventory", item.id), updatedItem);
            })
          ).then(() => {
            console.log("Migration complete!");
          }).catch((error) => {
            console.error("Migration error:", error);
          });

          // Update local state with companyId
          set((state) => ({
            items: state.items.map((item) =>
              !item.companyId ? { ...item, companyId } : item
            ),
          }));
        }

        // Set up real-time listener
        const itemsRef = collection(firestore, "inventory");
        const q = query(itemsRef, where("companyId", "==", companyId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const items: InventoryItem[] = [];
          snapshot.forEach((doc) => {
            items.push(doc.data() as InventoryItem);
          });
          set({ items });
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

      addItem: async (item) => {
        const { currentCompanyId } = get();
        if (!currentCompanyId) {
          throw new Error("No company ID set. Please log in first.");
        }

        const newItem: InventoryItem = {
          ...item,
          companyId: currentCompanyId,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Save to Firestore
        await setDoc(doc(firestore, "inventory", newItem.id), newItem);

        // Update local state
        set((state) => ({ items: [...state.items, newItem] }));
      },

      addItems: async (items) => {
        const { currentCompanyId } = get();
        if (!currentCompanyId) {
          throw new Error("No company ID set. Please log in first.");
        }

        const newItems: InventoryItem[] = items.map((item) => ({
          ...item,
          companyId: currentCompanyId,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));

        // Save all to Firestore
        await Promise.all(
          newItems.map((item) => setDoc(doc(firestore, "inventory", item.id), item))
        );

        // Update local state
        set((state) => ({ items: [...state.items, ...newItems] }));
      },

      updateItem: async (id, updates) => {
        const updateData = {
          ...updates,
          updatedAt: Date.now(),
        };

        // Update Firestore
        await updateDoc(doc(firestore, "inventory", id), updateData);

        // Update local state
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updateData } : item
          ),
        }));
      },

      deleteItem: async (id) => {
        // Delete from Firestore
        await deleteDoc(doc(firestore, "inventory", id));

        // Update local state
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearAll: () => {
        set({ items: [] });
      },

      getItemByBarcode: (barcode) => {
        return get().items.find((item) => item.barcode === barcode);
      },

      getLowStockItems: () => {
        return get().items.filter(
          (item) =>
            item.lowStockThreshold && item.quantity <= item.lowStockThreshold
        );
      },

      toggleStarred: async (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        const updateData = {
          isStarred: !item.isStarred,
          updatedAt: Date.now(),
        };

        // Update Firestore
        await updateDoc(doc(firestore, "inventory", id), updateData);

        // Update local state
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updateData } : item
          ),
        }));
      },

      getStarredLowStockItems: () => {
        return get().items.filter(
          (item) =>
            item.isStarred &&
            item.lowStockThreshold &&
            item.quantity <= item.lowStockThreshold
        );
      },

      findDuplicates: () => {
        const items = get().items;
        const groupedByName: { [key: string]: InventoryItem[] } = {};

        // Group items by normalized name
        items.forEach((item) => {
          const normalizedName = item.name.toLowerCase().trim();
          if (!groupedByName[normalizedName]) {
            groupedByName[normalizedName] = [];
          }
          groupedByName[normalizedName].push(item);
        });

        // Return only groups with more than one item (duplicates)
        return Object.values(groupedByName).filter((group) => group.length > 1);
      },

      mergeDuplicates: async (itemsToMerge, keepItem) => {
        // Sum up quantities from all items being merged
        const totalQuantity = itemsToMerge.reduce((sum, item) => sum + item.quantity, 0);

        // Delete merged items from Firestore
        await Promise.all(
          itemsToMerge
            .filter((item) => item.id !== keepItem.id)
            .map((item) => deleteDoc(doc(firestore, "inventory", item.id)))
        );

        // Update the kept item with the total quantity in Firestore
        await updateDoc(doc(firestore, "inventory", keepItem.id), {
          quantity: totalQuantity,
          updatedAt: Date.now(),
        });

        // Update local state
        set((state) => ({
          items: state.items
            .filter((item) => !itemsToMerge.find((m) => m.id === item.id) || item.id === keepItem.id)
            .map((item) =>
              item.id === keepItem.id
                ? { ...item, quantity: totalQuantity, updatedAt: Date.now() }
                : item
            ),
        }));
      },

      autoMergeAllDuplicates: async () => {
        const duplicateGroups = get().findDuplicates();
        let mergedCount = 0;
        let removedCount = 0;

        if (duplicateGroups.length === 0) {
          return { merged: 0, removed: 0 };
        }

        // Process each duplicate group
        const itemsToKeep = new Set<string>();
        const itemsToRemove = new Set<string>();

        duplicateGroups.forEach((group) => {
          // Keep the first item in the group (or the one with barcode if available)
          const keepItem = group.find((item) => item.barcode) || group[0];
          itemsToKeep.add(keepItem.id);
          mergedCount++;

          // Mark other items for removal
          group.forEach((item) => {
            if (item.id !== keepItem.id) {
              itemsToRemove.add(item.id);
              removedCount++;
            }
          });
        });

        // Delete removed items from Firestore
        await Promise.all(
          Array.from(itemsToRemove).map((id) => deleteDoc(doc(firestore, "inventory", id)))
        );

        // Update all remaining items to have quantity 0 in Firestore
        await Promise.all(
          Array.from(itemsToKeep).map((id) =>
            updateDoc(doc(firestore, "inventory", id), {
              quantity: 0,
              updatedAt: Date.now(),
            })
          )
        );

        // Update local state: remove duplicates and set all quantities to 0
        set((state) => ({
          items: state.items
            .filter((item) => !itemsToRemove.has(item.id))
            .map((item) => ({
              ...item,
              quantity: 0,
              updatedAt: Date.now(),
            })),
        }));

        return { merged: mergedCount, removed: removedCount };
      },

      bulkUpdateCategories: async (updates) => {
        // Update all items in Firestore
        await Promise.all(
          updates.map((update) =>
            updateDoc(doc(firestore, "inventory", update.id), {
              category: update.category,
              subcategory: update.subcategory,
              updatedAt: Date.now(),
            })
          )
        );

        // Update local state
        const updateMap = new Map(updates.map((u) => [u.id, { category: u.category, subcategory: u.subcategory }]));
        set((state) => ({
          items: state.items.map((item) => {
            const update = updateMap.get(item.id);
            if (update) {
              return {
                ...item,
                category: update.category,
                subcategory: update.subcategory,
                updatedAt: Date.now(),
              };
            }
            return item;
          }),
        }));
      },

      assignToProject: async (itemId, projectId) => {
        // Update Firestore
        await updateDoc(doc(firestore, "inventory", itemId), {
          assignedProjectId: projectId,
          updatedAt: Date.now(),
        });

        // Update local state
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, assignedProjectId: projectId, updatedAt: Date.now() }
              : item
          ),
        }));
      },

      getItemsByProject: (projectId) => {
        return get().items.filter((item) => item.assignedProjectId === projectId);
      },

      unassignFromProject: async (itemId) => {
        // Update Firestore
        await updateDoc(doc(firestore, "inventory", itemId), {
          assignedProjectId: undefined,
          updatedAt: Date.now(),
        });

        // Update local state
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, assignedProjectId: undefined, updatedAt: Date.now() }
              : item
          ),
        }));
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
