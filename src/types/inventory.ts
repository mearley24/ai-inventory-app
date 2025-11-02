export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  quantity: number;
  category: string;
  subcategory?: string; // Added subcategory support
  price?: number;
  description?: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  isStarred?: boolean; // Favorite/everyday items
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

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  category?: string;
}

export interface ParsedInvoice {
  vendor?: string;
  invoiceNumber?: string;
  date?: string;
  lineItems: InvoiceLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
}
