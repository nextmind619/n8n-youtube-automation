import { Router } from 'express';
import { readSheet } from '../services/sheets.js';
import { config } from '../config.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await readSheet(config.sheets.tabs.content);
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/:videoId', async (req, res, next) => {
  try {
    const items = await readSheet(config.sheets.tabs.content);
    const item = items.find((r) => r.video_id === req.params.videoId);
    if (!item) return res.status(404).json({ error: 'الفيديو غير موجود' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

export default router;
