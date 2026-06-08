import { Router } from 'express';
import { triggerWorkflow, listWorkflows } from '../services/n8n.js';
import { config } from '../config.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await listWorkflows();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/trigger/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const workflowId =
      type === 'discovery'
        ? config.n8n.workflows.topicDiscovery
        : type === 'production'
          ? config.n8n.workflows.videoProduction
          : req.body.workflowId;

    if (!workflowId) {
      return res.status(400).json({
        error: 'معرّف سير العمل غير مُعد. أضف WORKFLOW_TOPIC_DISCOVERY_ID أو WORKFLOW_VIDEO_PRODUCTION_ID',
      });
    }

    const result = await triggerWorkflow(workflowId);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

export default router;
