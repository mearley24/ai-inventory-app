export interface PasswordEntry {
  id: string;
  companyId: string;
  title: string;
  category: PasswordCategory;
  username?: string;
  encryptedPassword: string; // Encrypted
  website?: string;
  notes?: string;
  tags: string[];

  // Sharing & Permissions
  createdBy: string;
  sharedWith: string[]; // User IDs or Team IDs
  allowedRoles: string[]; // Which roles can access

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastAccessed?: number;
  accessCount: number;
}

export type PasswordCategory =
  | "Client System"
  | "Network"
  | "Control4"
  | "Security System"
  | "Audio/Video"
  | "Smart Home"
  | "Cloud Service"
  | "Admin"
  | "Other";

export interface PasswordVaultAccess {
  userId: string;
  passwordId: string;
  accessedAt: number;
  action: "viewed" | "copied" | "shared" | "modified";
}

export interface VaultSettings {
  requireAuthForAccess: boolean;
  autoLockTimeout: number; // minutes
  showPasswordPreview: boolean;
  enableAccessLogs: boolean;
}
