import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../config/secrets.env') });

function loadServiceAccount() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    return JSON.parse(inline);
  }

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (keyPath) {
    const fullPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', keyPath);
    if (existsSync(fullPath)) {
      return JSON.parse(readFileSync(fullPath, 'utf8'));
    }
  }

  return null;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'https://darkvault.app.n8n.cloud',
    apiKey: process.env.N8N_API_KEY || '',
    workflows: {
      topicDiscovery: process.env.WORKFLOW_TOPIC_DISCOVERY_ID || '',
      videoProduction: process.env.WORKFLOW_VIDEO_PRODUCTION_ID || '',
    },
  },
  sheets: {
    documentId: process.env.GOOGLE_SHEETS_DOCUMENT_ID || '',
    tabs: {
      queue: process.env.GOOGLE_SHEETS_QUEUE_TAB || 'Queue',
      content: process.env.GOOGLE_SHEETS_CONTENT_TAB || 'Content',
      errors: process.env.GOOGLE_SHEETS_ERRORS_TAB || 'Errors',
      logs: process.env.GOOGLE_SHEETS_LOGS_TAB || 'Logs',
    },
  },
  serviceAccount: loadServiceAccount(),
};
