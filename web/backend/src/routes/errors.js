import { Router } from 'express';
import { readSheet } from '../services/sheets.js';
import { config } from '../config.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await readSheet(config.sheets.tabs.errors);
    items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
