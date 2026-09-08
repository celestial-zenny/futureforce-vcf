import { ParsedContact, BulkConfig, SingleCardData } from '../types';

/**
 * Normalizes phone numbers with optional auto-country code logic.
 */
export function normalizePhoneNumber(
  rawPhone: string,
  autoCountryCode: boolean,
  defaultCountryCode: string
): string {
  // Strip non-digit characters except leading +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  if (!cleaned) return '';

  // If autoCountryCode is enabled:
  if (autoCountryCode) {
    const code = defaultCountryCode.replace(/[^\d+]/g, '');
    const codeDigits = code.replace(/^\+/, '');

    // If starts with single 0 (common local format e.g. 080... in Nigeria or 07... in UK)
    if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
      cleaned = `+${codeDigits}${cleaned.slice(1)}`;
    } else if (!cleaned.startsWith('+')) {
      // If does not already start with +
      if (!cleaned.startsWith(codeDigits)) {
        cleaned = `+${codeDigits}${cleaned}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }
  }

  // Ensure if it starts with digits and user has country code like +234
  if (!cleaned.startsWith('+') && cleaned.length >= 7) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Parses raw text input into a structured contact list
 */
export function parseRawText(
  rawText: string,
  config: BulkConfig
): { contacts: ParsedContact[]; duplicateCount: number; invalidCount: number } {
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const contacts: ParsedContact[] = [];
  const seenPhones = new Set<string>();
  let duplicateCount = 0;
  let invalidCount = 0;
  let counter = config.startNumber;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let extractedName = '';
    let extractedPhone = '';

    // Check for common delimiters: comma, colon, hyphen, tab, vertical bar
    if (line.includes(',') || line.includes(':') || line.includes(' - ') || line.includes('\t') || line.includes('|')) {
      const parts = line.split(/[,:\t|]|\s-\s/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const firstIsPhone = /^[\d\s+()\-./]{6,}$/.test(parts[0]);
        if (firstIsPhone) {
          extractedPhone = parts[0];
          extractedName = parts.slice(1).join(' ');
        } else {
          extractedName = parts[0];
          extractedPhone = parts.slice(1).join(' ');
        }
      } else {
        extractedPhone = line;
      }
    } else {
      // Regex check for phone number within line
      const phoneMatch = line.match(/(?:\+?\d{1,4}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?[\d\s-]{6,15}\d/);
      if (phoneMatch) {
        extractedPhone = phoneMatch[0].trim();
        extractedName = line.replace(extractedPhone, '').trim();
      } else {
        extractedPhone = line.trim();
      }
    }

    const sanitizedPhone = normalizePhoneNumber(
      extractedPhone,
      config.autoCountryCode,
      config.defaultCountryCode
    );

    const digitCount = sanitizedPhone.replace(/\D/g, '').length;
    if (digitCount < 6) {
      invalidCount++;
      continue;
    }

    // Check duplicate
    if (config.removeDuplicates && seenPhones.has(sanitizedPhone)) {
      duplicateCount++;
      continue;
    }
    seenPhones.add(sanitizedPhone);

    // Format full name based on template
    const paddedIndex = String(counter).padStart(config.zeroPad, '0');
    let fullName = '';
    const cleanPrefix = config.prefix.trim();

    switch (config.nameFormat) {
      case 'prefix_number':
        fullName = cleanPrefix ? `${cleanPrefix} ${paddedIndex}` : `Contact ${paddedIndex}`;
        break;
      case 'prefix_name':
        if (extractedName) {
          fullName = cleanPrefix ? `${cleanPrefix} - ${extractedName}` : extractedName;
        } else {
          fullName = cleanPrefix ? `${cleanPrefix} ${paddedIndex}` : `Contact ${paddedIndex}`;
        }
        break;
      case 'name_prefix':
        if (extractedName) {
          fullName = cleanPrefix ? `${extractedName} (${cleanPrefix})` : extractedName;
        } else {
          fullName = cleanPrefix ? `${cleanPrefix} ${paddedIndex}` : `Contact ${paddedIndex}`;
        }
        break;
      case 'name_only':
        if (extractedName) {
          fullName = extractedName;
        } else {
          fullName = cleanPrefix ? `${cleanPrefix} ${paddedIndex}` : `Contact ${paddedIndex}`;
        }
        break;
      default:
        fullName = cleanPrefix ? `${cleanPrefix} ${paddedIndex}` : `Contact ${paddedIndex}`;
    }

    contacts.push({
      id: `c_${i}_${Date.now()}`,
      fullName,
      phone: sanitizedPhone,
      originalRaw: line
    });

    counter++;
  }

  return { contacts, duplicateCount, invalidCount };
}

/**
 * Generates standard vCard 3.0 content for multiple contacts
 */
export function generateVcfString(contacts: ParsedContact[]): string {
  let vcf = '';
  for (const c of contacts) {
    vcf += 'BEGIN:VCARD\r\n';
    vcf += 'VERSION:3.0\r\n';
    vcf += `FN:${c.fullName}\r\n`;
    vcf += `N:;${c.fullName};;;\r\n`;
    vcf += `TEL;TYPE=CELL:${c.phone}\r\n`;
    vcf += 'END:VCARD\r\n';
  }
  return vcf;
}

/**
 * Generates standard vCard 3.0 content for a single contact
 */
export function generateSingleVCardString(card: SingleCardData): string {
  const fullName = [card.firstName, card.lastName].filter(Boolean).join(' ');
  let vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
  vcf += `FN:${fullName || 'Community Admin'}\r\n`;
  vcf += `N:${card.lastName || ''};${card.firstName || ''};;;\r\n`;
  if (card.organization) vcf += `ORG:${card.organization}\r\n`;
  if (card.title) vcf += `TITLE:${card.title}\r\n`;
  if (card.phone) vcf += `TEL;TYPE=CELL,VOICE:${card.phone}\r\n`;
  if (card.email) vcf += `EMAIL;TYPE=INTERNET:${card.email}\r\n`;
  if (card.website) vcf += `URL:${card.website}\r\n`;
  if (card.note) vcf += `NOTE:${card.note}\r\n`;
  vcf += 'END:VCARD\r\n';
  return vcf;
}

/**
 * Export contacts as CSV format
 */
export function generateCsvString(contacts: ParsedContact[]): string {
  let csv = 'Name,Phone Number\r\n';
  for (const c of contacts) {
    const escapedName = `"${c.fullName.replace(/"/g, '""')}"`;
    csv += `${escapedName},${c.phone}\r\n`;
  }
  return csv;
}

/**
 * Export contacts as TXT format (phone numbers only)
 */
export function generateTxtString(contacts: ParsedContact[]): string {
  return contacts.map(c => `${c.fullName}: ${c.phone}`).join('\r\n');
}

/**
 * Trigger file download via browser Blob
 */
export function downloadBlobFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
