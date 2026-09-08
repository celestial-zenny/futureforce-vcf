import { VcfPool, PoolPublicInfo, ContactEntry } from '../types';

export async function createPoolApi(data: {
  title: string;
  prefix: string;
  description: string;
  durationMinutes: number;
  defaultCountryCode: string;
  removeDuplicates: boolean;
  allowPublicDownload: boolean;
}): Promise<{ pool: VcfPool; adminKey: string }> {
  const res = await fetch('/api/pools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create collection link.');
  }

  return { pool: json.pool, adminKey: json.adminKey };
}

export async function getPublicPoolApi(poolId: string): Promise<PoolPublicInfo> {
  const res = await fetch(`/api/pools/${poolId}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Collection link not found.');
  }
  return json.pool;
}

export async function submitContactApi(
  poolId: string,
  name: string,
  phone: string
): Promise<{ success: boolean; message?: string; count?: number; contact?: ContactEntry }> {
  const res = await fetch(`/api/pools/${poolId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to submit contact.');
  }
  return json;
}

export async function getAdminPoolApi(adminKey: string): Promise<VcfPool> {
  const res = await fetch(`/api/pools/admin/${adminKey}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Invalid admin key or collection not found.');
  }
  return json.pool;
}

export async function updateAdminPoolApi(
  adminKey: string,
  updates: any
): Promise<VcfPool> {
  const res = await fetch(`/api/pools/admin/${adminKey}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update settings.');
  }
  return json.pool;
}

export async function deleteContactApi(adminKey: string, contactId: string): Promise<boolean> {
  const res = await fetch(`/api/pools/admin/${adminKey}/contacts/${contactId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  return json.success;
}
