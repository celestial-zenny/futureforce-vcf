export interface ParsedContact {
  id: string;
  fullName: string;
  phone: string;
  originalRaw: string;
}

export type NameFormatStyle = 
  | 'prefix_number'       // e.g. Futureforce 001
  | 'prefix_name'         // e.g. Futureforce - John Doe
  | 'name_prefix'         // e.g. John Doe (Futureforce)
  | 'name_only';          // e.g. John Doe (or Futureforce 001 if no name)

export interface BulkConfig {
  prefix: string;
  startNumber: number;
  zeroPad: number;
  autoCountryCode: boolean;
  defaultCountryCode: string;
  removeDuplicates: boolean;
  fileName: string;
  nameFormat: NameFormatStyle;
}

export interface SingleCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  whatsappUrl: string;
  note: string;
}

export interface ContactEntry {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface VcfPool {
  id: string;
  adminKey: string;
  title: string;
  prefix: string;
  description: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'ended';
  defaultCountryCode: string;
  removeDuplicates: boolean;
  allowPublicDownload: boolean;
  contacts: ContactEntry[];
  downloadCount: number;
}

export interface PoolPublicInfo {
  id: string;
  title: string;
  prefix: string;
  description: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'ended';
  defaultCountryCode: string;
  removeDuplicates: boolean;
  allowPublicDownload: boolean;
  contactCount: number;
  isExpired: boolean;
  contacts?: ContactEntry[];
}

export interface SavedLocalCampaign {
  id: string;
  adminKey: string;
  title: string;
  prefix: string;
  createdAt: string;
  expiresAt: string;
}
