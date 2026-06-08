import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readSheet, appendRow, updateRowByKey, getHeaders } from '../services/sheets.js';
import { config } from '../config.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await readSheet(config.sheets.tabs.queue);
    items.sort((a, b) => {
      const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0);
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { topic, source = 'manual', priority = 5, scheduled_at } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'الموضوع مطلوب' });
    }

    const headers = await getHeaders(config.sheets.tabs.queue);
    const now = new Date().toISOString();
    const item = {
      queue_id: uuidv4(),
      status: 'pending',
      topic: topic.trim(),
      source,
      priority: String(priority),
      retry_count: '0',
      scheduled_at: scheduled_at || now,
      started_at: '',
      completed_at: '',
      error_message: '',
    };

    const rowValues = headers.map((h) => item[h] ?? '');
    await appendRow(config.sheets.tabs.queue, rowValues);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch('/:queueId', async (req, res, next) => {
  try {
    const allowed = ['status', 'priority', 'scheduled_at', 'topic'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = String(req.body[key]);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'لا توجد حقول للتحديث' });
    }

    const updated = await updateRowByKey(
      config.sheets.tabs.queue,
      'queue_id',
      req.params.queueId,
      updates
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
