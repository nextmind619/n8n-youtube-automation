import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    n8n: { configured: Boolean(config.n8n.apiKey), baseUrl: config.n8n.baseUrl },
    sheets: {
      configured: Boolean(config.serviceAccount && config.sheets.documentId),
      documentId: config.sheets.documentId,
    },
  });
});

export default router;
