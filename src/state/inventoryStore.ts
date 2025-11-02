import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InventoryItem } from "../types/inventory";

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => void;
  addItems: (items: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">[]) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  clearAll: () => void;
  getItemByBarcode: (barcode: string) => InventoryItem | undefined;
  getLowStockItems: () => InventoryItem[];
  toggleStarred: (id: string) => void;
  getStarredLowStockItems: () => InventoryItem[];
  findDuplicates: () => InventoryItem[][];
  mergeDuplicates: (itemsToMerge: InventoryItem[], keepItem: InventoryItem) => void;
  autoMergeAllDuplicates: () => { merged: number; removed: number };
  bulkUpdateCategories: (updates: { id: string; category: string; subcategory?: string }[]) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem: InventoryItem = {
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      addItems: (items) => {
        const newItems: InventoryItem[] = items.map((item) => ({
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
        set((state) => ({ items: [...state.items, ...newItems] }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: Date.now() }
              : item
          ),
        }));
      },

      deleteItem: (id) => {
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

      toggleStarred: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, isStarred: !item.isStarred, updatedAt: Date.now() }
              : item
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

      mergeDuplicates: (itemsToMerge, keepItem) => {
        // Sum up quantities from all items being merged
        const totalQuantity = itemsToMerge.reduce((sum, item) => sum + item.quantity, 0);

        // Update the kept item with the total quantity
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

      autoMergeAllDuplicates: () => {
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

        // Update state: remove duplicates and set all quantities to 0
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

      bulkUpdateCategories: (updates) => {
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
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
