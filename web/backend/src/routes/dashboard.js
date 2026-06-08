import { Router } from 'express';
import { readSheet } from '../services/sheets.js';
import { config } from '../config.js';

const router = Router();

router.get('/stats', async (_req, res, next) => {
  try {
    const [queue, content, errors, logs] = await Promise.all([
      readSheet(config.sheets.tabs.queue),
      readSheet(config.sheets.tabs.content),
      readSheet(config.sheets.tabs.errors),
      readSheet(config.sheets.tabs.logs),
    ]);

    const queueStats = {
      pending: queue.filter((r) => r.status === 'pending').length,
      processing: queue.filter((r) => r.status === 'processing').length,
      completed: queue.filter((r) => r.status === 'completed').length,
      failed: queue.filter((r) => r.status === 'failed').length,
      retry: queue.filter((r) => r.status === 'retry').length,
      total: queue.length,
    };

    const contentStats = {
      completed: content.filter((r) => r.status === 'completed').length,
      failed: content.filter((r) => r.status === 'failed').length,
      withYoutube: content.filter((r) => r.youtube_short_url || r.youtube_long_url).length,
      total: content.length,
    };

    res.json({
      queue: queueStats,
      content: contentStats,
      errors: { total: errors.length, recent: errors.slice(-5).reverse() },
      logs: { total: logs.length, recent: logs.slice(-5).reverse() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
