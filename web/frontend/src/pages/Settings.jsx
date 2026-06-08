import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.health()
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>الإعدادات</h2>
        <p>حالة الاتصال والتكوين</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {health ? (
        <>
          <div className="card">
            <h3>حالة الخدمات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className={`status-dot ${health.sheets?.configured ? 'ok' : 'warn'}`}>
                Google Sheets: {health.sheets?.configured ? 'مُعد ✓' : 'غير مُعد — أضف Service Account'}
              </div>
              <div className={`status-dot ${health.n8n?.configured ? 'ok' : 'warn'}`}>
                n8n API: {health.n8n?.configured ? 'مُعد ✓' : 'غير مُعد — أضف N8N_API_KEY'}
              </div>
            </div>
          </div>

          <div className="card">
            <h3>روابط سريعة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <a className="link" href={health.n8n?.baseUrl} target="_blank" rel="noreferrer">
                n8n Dashboard
              </a>
              <a
                className="link"
                href={`https://docs.google.com/spreadsheets/d/${health.sheets?.documentId}/edit`}
                target="_blank"
                rel="noreferrer"
              >
                Google Sheet
              </a>
              <a className="link" href="https://studio.youtube.com" target="_blank" rel="noreferrer">
                YouTube Studio
              </a>
            </div>
          </div>

          <div className="card">
            <h3>خطوات الإعداد</h3>
            <ol style={{ paddingRight: '1.25rem', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 2 }}>
              <li>أنشئ Service Account في Google Cloud وفعّل Sheets API</li>
              <li>شارك Google Sheet مع email الـ Service Account (Editor)</li>
              <li>ضع ملف JSON في <code>config/google-service-account.json</code></li>
              <li>انسخ <code>N8N_API_KEY</code> من n8n إلى <code>web/backend/.env</code></li>
              <li>أضف معرّفات workflows: <code>WORKFLOW_VIDEO_PRODUCTION_ID</code></li>
            </ol>
          </div>
        </>
      ) : (
        <div className="loading">جاري التحميل...</div>
      )}
    </div>
  );
}
