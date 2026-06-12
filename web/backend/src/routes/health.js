import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2025-06-12-webhook',
    n8n: {
      configured: Boolean(config.n8n.apiKey),
      baseUrl: config.n8n.baseUrl,
      webhookPath: config.n8n.webhooks.fallback || null,
      webhookDiscovery: config.n8n.webhooks.discovery || null,
      webhookProduction: config.n8n.webhooks.production || null,
    },
    sheets: {
      configured: Boolean(config.serviceAccount && config.sheets.documentId),
      documentId: config.sheets.documentId,
    },
  });
});

export default router;
