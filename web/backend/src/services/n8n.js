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

export async function triggerWorkflow(workflowId) {
  return n8nFetch(`/workflows/${workflowId}/run`, { method: 'POST' });
}

export async function getWorkflowExecutions(workflowId, limit = 10) {
  return n8nFetch(`/executions?workflowId=${workflowId}&limit=${limit}`);
}
