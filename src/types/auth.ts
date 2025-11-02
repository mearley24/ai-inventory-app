export interface User {
  uid: string;
  email: string;
  displayName: string;
  companyId: string;
  role: UserRole;
  teams: string[];
  createdAt: number;
  lastActive: number;
}

export type UserRole = "owner" | "admin" | "manager" | "field_worker";

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  subscriptionTier: "free" | "pro" | "enterprise";
  settings: CompanySettings;
}

export interface CompanySettings {
  allowFieldWorkerDelete: boolean;
  requireApprovalForNewItems: boolean;
  enableTimeTracking: boolean;
}

export interface Team {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  loading: boolean;
  error: string | null;
}
