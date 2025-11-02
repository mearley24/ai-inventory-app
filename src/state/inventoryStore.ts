import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InventoryItem } from "../types/inventory";

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  getItemByBarcode: (barcode: string) => InventoryItem | undefined;
  getLowStockItems: () => InventoryItem[];
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

      getItemByBarcode: (barcode) => {
        return get().items.find((item) => item.barcode === barcode);
      },

      getLowStockItems: () => {
        return get().items.filter(
          (item) =>
            item.lowStockThreshold && item.quantity <= item.lowStockThreshold
        );
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
