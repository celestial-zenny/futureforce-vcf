import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { VcfPool, ContactEntry, PoolPublicInfo } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'pools.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

function loadPools(): Record<string, VcfPool> {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading pools database, initializing fresh:', err);
    return {};
  }
}

function savePools(pools: Record<string, VcfPool>) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(pools, null, 2), 'utf-8');
}

export function normalizePhone(rawPhone: string, defaultCountryCode: string = '+234'): string {
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (!cleaned) return '';

  const codeDigits = defaultCountryCode.replace(/[^\d]/g, '');

  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = `+${codeDigits}${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith('+')) {
    if (!cleaned.startsWith(codeDigits)) {
      cleaned = `+${codeDigits}${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }

  return cleaned;
}

export function isPoolExpired(pool: VcfPool): boolean {
  if (pool.status === 'ended') return true;
  const expiryTime = new Date(pool.expiresAt).getTime();
  return Date.now() >= expiryTime;
}

export function createNewPool(params: {
  title: string;
  prefix?: string;
  description?: string;
  durationMinutes: number;
  defaultCountryCode?: string;
  removeDuplicates?: boolean;
  allowPublicDownload?: boolean;
}): { pool: VcfPool; adminKey: string } {
  const pools = loadPools();

  // Generate unique public ID and adminKey
  const id = 'vcf_' + crypto.randomBytes(4).toString('hex');
  const adminKey = 'adm_' + crypto.randomBytes(12).toString('hex');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.durationMinutes * 60 * 1000);

  const newPool: VcfPool = {
    id,
    adminKey,
    title: params.title.trim() || 'Futureforce VCF Drop',
    prefix: (params.prefix || 'Futureforce').trim(),
    description: (params.description || '').trim(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    defaultCountryCode: params.defaultCountryCode || '+234',
    removeDuplicates: params.removeDuplicates ?? true,
    allowPublicDownload: params.allowPublicDownload ?? true,
    contacts: [],
    downloadCount: 0,
  };

  pools[id] = newPool;
  savePools(pools);

  return { pool: newPool, adminKey };
}

export function getPublicPoolInfo(id: string): PoolPublicInfo | null {
  const pools = loadPools();
  const pool = pools[id];
  if (!pool) return null;

  const expired = isPoolExpired(pool);

  return {
    id: pool.id,
    title: pool.title,
    prefix: pool.prefix,
    description: pool.description,
    createdAt: pool.createdAt,
    expiresAt: pool.expiresAt,
    status: expired ? 'ended' : pool.status,
    defaultCountryCode: pool.defaultCountryCode,
    removeDuplicates: pool.removeDuplicates,
    allowPublicDownload: pool.allowPublicDownload,
    contactCount: pool.contacts.length,
    isExpired: expired,
    // If pool is expired and creator allowed public download, share contacts
    contacts: (expired && pool.allowPublicDownload) ? pool.contacts : undefined,
  };
}

export function getAdminPool(adminKey: string): VcfPool | null {
  const pools = loadPools();
  const pool = Object.values(pools).find(p => p.adminKey === adminKey);
  if (!pool) return null;

  if (pool.status === 'active' && isPoolExpired(pool)) {
    pool.status = 'ended';
    savePools(pools);
  }

  return pool;
}

export function addContact(poolId: string, name: string, phone: string): {
  success: boolean;
  message?: string;
  contact?: ContactEntry;
  count?: number;
} {
  const pools = loadPools();
  const pool = pools[poolId];
  if (!pool) {
    return { success: false, message: 'Collection link not found or expired.' };
  }

  if (isPoolExpired(pool)) {
    return { success: false, message: 'This collection pool has reached its time expiration and is now closed.' };
  }

  const cleanName = name.trim();
  const normalized = normalizePhone(phone, pool.defaultCountryCode);

  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 7) {
    return { success: false, message: 'Please enter a valid phone number with dial code.' };
  }

  if (pool.removeDuplicates) {
    const exists = pool.contacts.some(c => c.phone === normalized);
    if (exists) {
      return { success: false, message: 'This phone number has already been registered in this pool.' };
    }
  }

  const contact: ContactEntry = {
    id: 'cnt_' + crypto.randomBytes(4).toString('hex'),
    name: cleanName,
    phone: normalized,
    createdAt: new Date().toISOString(),
  };

  pool.contacts.push(contact);
  savePools(pools);

  return { success: true, contact, count: pool.contacts.length };
}

export function removeContact(adminKey: string, contactId: string): boolean {
  const pools = loadPools();
  const pool = Object.values(pools).find(p => p.adminKey === adminKey);
  if (!pool) return false;

  const initialLen = pool.contacts.length;
  pool.contacts = pool.contacts.filter(c => c.id !== contactId);
  if (pool.contacts.length !== initialLen) {
    savePools(pools);
    return true;
  }
  return false;
}

export function updatePoolSettings(adminKey: string, updates: Partial<{
  title: string;
  prefix: string;
  description: string;
  status: 'active' | 'ended';
  allowPublicDownload: boolean;
  extendMinutes: number;
}>): VcfPool | null {
  const pools = loadPools();
  const pool = Object.values(pools).find(p => p.adminKey === adminKey);
  if (!pool) return null;

  if (updates.title !== undefined) pool.title = updates.title.trim();
  if (updates.prefix !== undefined) pool.prefix = updates.prefix.trim();
  if (updates.description !== undefined) pool.description = updates.description.trim();
  if (updates.status !== undefined) pool.status = updates.status;
  if (updates.allowPublicDownload !== undefined) pool.allowPublicDownload = updates.allowPublicDownload;

  if (updates.extendMinutes && updates.extendMinutes > 0) {
    const currentExpiry = Math.max(Date.now(), new Date(pool.expiresAt).getTime());
    pool.expiresAt = new Date(currentExpiry + updates.extendMinutes * 60 * 1000).toISOString();
    pool.status = 'active';
  }

  savePools(pools);
  return pool;
}

export function incrementDownloadCount(poolId: string) {
  const pools = loadPools();
  const pool = pools[poolId];
  if (pool) {
    pool.downloadCount = (pool.downloadCount || 0) + 1;
    savePools(pools);
  }
}

/**
 * Builds RFC-standard vCard 3.0 content for a pool
 */
export function buildVcfContent(pool: VcfPool): string {
  let vcf = '';
  const prefix = pool.prefix.trim() || 'Contact';

  pool.contacts.forEach((c, idx) => {
    const padded = String(idx + 1).padStart(3, '0');
    const contactDisplayName = c.name 
      ? `${prefix} ${padded} - ${c.name}`
      : `${prefix} ${padded}`;

    vcf += 'BEGIN:VCARD\r\n';
    vcf += 'VERSION:3.0\r\n';
    vcf += `FN:${contactDisplayName}\r\n`;
    vcf += `N:;${contactDisplayName};;;\r\n`;
    vcf += `TEL;TYPE=CELL:${c.phone}\r\n`;
    vcf += `NOTE:Collected via Futureforce VCF Drop (${pool.title})\r\n`;
    vcf += 'END:VCARD\r\n';
  });

  return vcf;
}

export function buildCsvContent(pool: VcfPool): string {
  let csv = 'Index,Formatted Name,Submitter Name,Phone Number,Joined At\r\n';
  const prefix = pool.prefix.trim() || 'Contact';

  pool.contacts.forEach((c, idx) => {
    const padded = String(idx + 1).padStart(3, '0');
    const contactDisplayName = c.name 
      ? `${prefix} ${padded} - ${c.name}`
      : `${prefix} ${padded}`;
    const safeName = `"${(c.name || '').replace(/"/g, '""')}"`;
    const safeFull = `"${contactDisplayName.replace(/"/g, '""')}"`;
    csv += `${idx + 1},${safeFull},${safeName},${c.phone},${c.createdAt}\r\n`;
  });

  return csv;
}

export function buildTxtContent(pool: VcfPool): string {
  return pool.contacts.map(c => `${c.phone}${c.name ? ` (${c.name})` : ''}`).join('\r\n');
}
