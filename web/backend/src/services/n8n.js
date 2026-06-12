import { config } from '../config.js';

async function n8nFetch(path, options = {}) {
  if (!config.n8n.apiKey) {
    throw new Error('N8N_API_KEY غير مُعد في .env');
  }

  const url = `${config.n8n.baseUrl}/api/v1${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': config.n8n.apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n API error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function listWorkflows() {
  return n8nFetch('/workflows?limit=50');
}

function findWebhookPath(workflow) {
  const webhookNode = workflow?.nodes?.find(
    (node) => node.type === 'n8n-nodes-base.webhook'
  );
  return webhookNode?.parameters?.path ?? null;
}

async function triggerViaWebhook(webhookPath) {
  const url = `${config.n8n.baseUrl}/webhook/${webhookPath}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'autopilot-dashboard' }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n webhook error ${response.status}: ${text}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

const WEBHOOK_SETUP_HINT =
  'أضف عقدة Webhook في n8n (POST) واربطها بنفس مسار Manual Trigger، ثم فعّل سير العمل.';

export async function triggerWorkflow(workflowId, triggerType = '') {
  const configuredPath =
    triggerType === 'discovery'
      ? config.n8n.webhooks.discovery
      : triggerType === 'production'
        ? config.n8n.webhooks.production
        : config.n8n.webhooks.fallback;

  if (configuredPath) {
    return triggerViaWebhook(configuredPath);
  }

  const workflow = await n8nFetch(`/workflows/${workflowId}`);
  const webhookPath = findWebhookPath(workflow);
  if (webhookPath) {
    return triggerViaWebhook(webhookPath);
  }

  try {
    return await n8nFetch(`/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({ workflowData: workflow }),
    });
  } catch (err) {
    if (String(err.message).includes('405')) {
      throw new Error(
        `تشغيل سير العمل عبر API غير مدعوم في n8n Community Edition. ${WEBHOOK_SETUP_HINT}`
      );
    }
    throw err;
  }
}

export async function getWorkflowExecutions(workflowId, limit = 10) {
  return n8nFetch(`/executions?workflowId=${workflowId}&limit=${limit}`);
}
