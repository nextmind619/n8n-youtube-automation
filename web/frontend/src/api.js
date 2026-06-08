const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

export const api = {
  health: () => request('/health'),
  stats: () => request('/dashboard/stats'),
  queue: {
    list: () => request('/queue'),
    create: (body) => request('/queue', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/queue/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  content: {
    list: () => request('/content'),
    get: (id) => request(`/content/${id}`),
  },
  errors: () => request('/errors'),
  logs: () => request('/logs'),
  workflows: {
    list: () => request('/workflows'),
    trigger: (type) => request(`/workflows/trigger/${type}`, { method: 'POST' }),
  },
};
