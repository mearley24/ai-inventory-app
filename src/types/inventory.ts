export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  quantity: number;
  category: string;
  description?: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  totalTime: number; // in seconds
}

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
}

export interface ActiveTimer {
  projectId: string;
  startTime: number;
}
