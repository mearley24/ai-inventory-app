export interface InventoryItem {
  id: string;
  companyId: string; // For multi-company sync
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
  assignedProjectId?: string; // Project assignment
  supplier?: string; // Supplier/source (e.g., "SnapAV", "Adorama", etc.)
  location?: string; // Physical storage location (e.g., "Shelf A-3", "Bin 12", "Truck")
  createdAt: number;
  updatedAt: number;
}

export interface ProposalItem {
  name: string;
  quantity: number;
  matchedInventoryId?: string; // ID of matching inventory item
  inStock: boolean; // Whether we have enough in stock
  availableQuantity: number; // How many we have available
  category?: string;
  price?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  totalTime: number; // in seconds
  // Proposal fields
  clientName?: string;
  clientEmail?: string;
  proposalItems?: ProposalItem[];
  proposalStatus?: "pending" | "approved" | "in-progress" | "completed";
  proposalDate?: number;
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
