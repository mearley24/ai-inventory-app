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
        // Temporarily disable real-time sync for performance
        console.log("Firestore real-time sync DISABLED for performance");
        set({ unsubscribe: null, currentCompanyId: companyId });

        // Just set the company ID, don't sync from Firestore
        // All data will be local-only for maximum performance
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

        console.log("✅ Adding item to store:", newItem.name);

        // DISABLED: Firestore write for performance
        // await setDoc(doc(firestore, "inventory", newItem.id), newItem);

        // Update local state only
        set((state) => {
          const newItems = [...state.items, newItem];
          console.log("✅ New item count:", newItems.length);
          return { items: newItems };
        });
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

        console.log(`✅ Adding ${newItems.length} items to store`);

        // DISABLED: Firestore write for performance
        // await Promise.all(
        //   newItems.map((item) => setDoc(doc(firestore, "inventory", item.id), item))
        // );

        // Update local state only
        set((state) => {
          const allItems = [...state.items, ...newItems];
          console.log("✅ Total items now:", allItems.length);
          return { items: allItems };
        });
      },

      updateItem: async (id, updates) => {
        const updateData = {
          ...updates,
          updatedAt: Date.now(),
        };

        // DISABLED: Firestore write for performance
        // await updateDoc(doc(firestore, "inventory", id), updateData);

        // Update local state only
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updateData } : item
          ),
        }));
      },

      deleteItem: async (id) => {
        // DISABLED: Firestore write for performance
        // await deleteDoc(doc(firestore, "inventory", id));

        // Update local state only
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearAll: async () => {
        // DISABLED: Firestore write for performance
        // const currentItems = get().items;
        // await Promise.all(
        //   currentItems.map((item) => deleteDoc(doc(firestore, "inventory", item.id)))
        // );

        // Clear local state only
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

        // DISABLED: Firestore write for performance
        // await updateDoc(doc(firestore, "inventory", id), updateData);

        // Update local state only
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

        // Group items by aggressively normalized name
        items.forEach((item) => {
          // Remove all spaces, special chars, convert to lowercase
          const normalizedName = item.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .trim();

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
        for (const group of duplicateGroups) {
          // Keep the item with barcode if available, otherwise keep the first one
          const keepItem = group.find((item) => item.barcode) || group[0];

          // Sum up all quantities
          const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);

          // Get all items to remove (everything except the one we're keeping)
          const itemsToRemove = group.filter((item) => item.id !== keepItem.id);

          // Delete removed items from Firestore
          await Promise.all(
            itemsToRemove.map((item) => deleteDoc(doc(firestore, "inventory", item.id)))
          );

          // Update the kept item with combined quantity
          await updateDoc(doc(firestore, "inventory", keepItem.id), {
            quantity: totalQuantity,
            updatedAt: Date.now(),
          });

          mergedCount++;
          removedCount += itemsToRemove.length;
        }

        // Update local state: remove duplicates and update quantities
        set((state) => {
          const itemsToRemoveIds = new Set<string>();
          const itemsToUpdate = new Map<string, number>();

          duplicateGroups.forEach((group) => {
            const keepItem = group.find((item) => item.barcode) || group[0];
            const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);

            itemsToUpdate.set(keepItem.id, totalQuantity);

            group.forEach((item) => {
              if (item.id !== keepItem.id) {
                itemsToRemoveIds.add(item.id);
              }
            });
          });

          return {
            items: state.items
              .filter((item) => !itemsToRemoveIds.has(item.id))
              .map((item) => {
                const newQuantity = itemsToUpdate.get(item.id);
                if (newQuantity !== undefined) {
                  return { ...item, quantity: newQuantity, updatedAt: Date.now() };
                }
                return item;
              }),
          };
        });

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
      // Persist items locally for offline access
      partialize: (state) => ({
        items: state.items,
        currentCompanyId: state.currentCompanyId,
        // Don't persist unsubscribe function
      }),
    }
  )
);
