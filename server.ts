import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  createNewPool,
  getPublicPoolInfo,
  getAdminPool,
  addContact,
  removeContact,
  updatePoolSettings,
  buildVcfContent,
  buildCsvContent,
  buildTxtContent,
  incrementDownloadCount,
  isPoolExpired
} from './server/storage';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create a new VCF collection pool
  app.post('/api/pools', (req, res) => {
    try {
      const {
        title,
        prefix,
        description,
        durationMinutes,
        defaultCountryCode,
        removeDuplicates,
        allowPublicDownload
      } = req.body;

      const duration = parseInt(durationMinutes) || 1440; // default 24h

      const { pool, adminKey } = createNewPool({
        title: title || 'Futureforce VCF Drop',
        prefix: prefix || 'Futureforce',
        description: description || '',
        durationMinutes: Math.max(5, duration),
        defaultCountryCode: defaultCountryCode || '+234',
        removeDuplicates: removeDuplicates !== false,
        allowPublicDownload: allowPublicDownload !== false,
      });

      res.status(201).json({
        success: true,
        poolId: pool.id,
        adminKey,
        pool
      });
    } catch (err: any) {
      console.error('Error creating pool:', err);
      res.status(500).json({ success: false, message: 'Failed to create collection link.' });
    }
  });

  // Get public pool details
  app.get('/api/pools/:id', (req, res) => {
    const info = getPublicPoolInfo(req.params.id);
    if (!info) {
      return res.status(404).json({ success: false, message: 'Collection link not found or expired.' });
    }
    res.json({ success: true, pool: info });
  });

  // Participant submits contact into pool
  app.post('/api/pools/:id/contacts', (req, res) => {
    const { name, phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const result = addContact(req.params.id, name || '', phone);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  });

  // Admin retrieves full pool details and live contacts
  app.get('/api/pools/admin/:adminKey', (req, res) => {
    const pool = getAdminPool(req.params.adminKey);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Invalid admin key or collection not found.' });
    }
    res.json({ success: true, pool });
  });

  // Admin updates pool settings or timer
  app.patch('/api/pools/admin/:adminKey', (req, res) => {
    const updated = updatePoolSettings(req.params.adminKey, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Admin key invalid.' });
    }
    res.json({ success: true, pool: updated });
  });

  // Admin deletes a contact
  app.delete('/api/pools/admin/:adminKey/contacts/:contactId', (req, res) => {
    const ok = removeContact(req.params.adminKey, req.params.contactId);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Contact not found or invalid admin key.' });
    }
    res.json({ success: true, message: 'Contact removed successfully.' });
  });

  // Admin exports contacts in requested format (vcf, csv, txt)
  app.get('/api/pools/admin/:adminKey/export/:format', (req, res) => {
    const pool = getAdminPool(req.params.adminKey);
    if (!pool) {
      return res.status(404).send('Invalid admin key.');
    }

    incrementDownloadCount(pool.id);
    const safeTitle = (pool.title || 'Contacts').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const format = req.params.format.toLowerCase();

    if (format === 'vcf') {
      const vcfData = buildVcfContent(pool);
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.vcf"`);
      return res.send(vcfData);
    } else if (format === 'csv') {
      const csvData = buildCsvContent(pool);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.csv"`);
      return res.send(csvData);
    } else if (format === 'txt') {
      const txtData = buildTxtContent(pool);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_numbers.txt"`);
      return res.send(txtData);
    }

    res.status(400).send('Unsupported format.');
  });

  // Public export if permitted and expired
  app.get('/api/pools/:id/export/:format', (req, res) => {
    const pools = getPublicPoolInfo(req.params.id);
    if (!pools) {
      return res.status(404).send('Pool not found.');
    }

    // Must be expired and public download allowed
    if (!pools.isExpired || !pools.allowPublicDownload) {
      return res.status(403).send('Download is only available after collection ends.');
    }

    // Need full pool object for export
    const fullPool = getAdminPool(req.params.id) || (getPublicPoolInfo(req.params.id) as any);
    if (!fullPool || !fullPool.contacts) {
      return res.status(404).send('Contacts not available.');
    }

    incrementDownloadCount(pools.id);
    const safeTitle = (pools.title || 'Contacts').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const format = req.params.format.toLowerCase();

    if (format === 'vcf') {
      const vcfData = buildVcfContent(fullPool);
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.vcf"`);
      return res.send(vcfData);
    } else if (format === 'csv') {
      const csvData = buildCsvContent(fullPool);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.csv"`);
      return res.send(csvData);
    }

    res.status(400).send('Unsupported format.');
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Futureforce VCF Server running on http://localhost:${PORT}`);
  });
}

startServer();
