import { useEffect, useState } from 'react';
import { api } from '../api';

function StatCard({ label, value, variant }) {
  return (
    <div className={`stat-card ${variant || ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value ?? 0}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [triggerMsg, setTriggerMsg] = useState('');

  useEffect(() => {
    Promise.all([api.stats(), api.health()])
      .then(([s, h]) => {
        setStats(s);
        setHealth(h);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleTrigger(type) {
    setTriggerMsg('');
    try {
      await api.workflows.trigger(type);
      setTriggerMsg(type === 'discovery' ? 'تم تشغيل اكتشاف المواضيع' : 'تم تشغيل خط الإنتاج');
    } catch (e) {
      setTriggerMsg(e.message);
    }
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>لوحة التحكم</h2>
        </div>
        <div className="alert alert-error">{error}</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          تأكد من تشغيل Backend وتكوين Google Service Account.
        </p>
      </div>
    );
  }

  if (!stats) return <div className="loading">جاري التحميل...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>لوحة التحكم</h2>
        <p>نظرة عامة على خط إنتاج يوتيوب الآلي</p>
      </div>

      {health && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span className={`status-dot ${health.sheets?.configured ? 'ok' : 'warn'}`}>
              Google Sheets {health.sheets?.configured ? 'متصل' : 'غير مُعد'}
            </span>
            <span className={`status-dot ${health.n8n?.configured ? 'ok' : 'warn'}`}>
              n8n API {health.n8n?.configured ? 'متصل' : 'غير مُعد'}
            </span>
          </div>
        </div>
      )}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={() => handleTrigger('discovery')}>
          تشغيل اكتشاف المواضيع
        </button>
        <button className="btn btn-secondary" onClick={() => handleTrigger('production')}>
          تشغيل خط الإنتاج
        </button>
      </div>

      {triggerMsg && (
        <div className={`alert ${triggerMsg.includes('تم') ? 'alert-success' : 'alert-error'}`}>
          {triggerMsg}
        </div>
      )}

      <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>الطابور</h3>
      <div className="stats-grid">
        <StatCard label="معلق" value={stats.queue.pending} variant="pending" />
        <StatCard label="قيد المعالجة" value={stats.queue.processing} variant="processing" />
        <StatCard label="مكتمل" value={stats.queue.completed} variant="completed" />
        <StatCard label="فشل" value={stats.queue.failed} variant="failed" />
        <StatCard label="إجمالي" value={stats.queue.total} />
      </div>

      <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>المحتوى</h3>
      <div className="stats-grid">
        <StatCard label="فيديوهات مكتملة" value={stats.content.completed} variant="completed" />
        <StatCard label="مرفوعة على يوتيوب" value={stats.content.withYoutube} />
        <StatCard label="فشل الإنتاج" value={stats.content.failed} variant="failed" />
        <StatCard label="إجمالي" value={stats.content.total} />
      </div>

      {stats.errors.recent?.length > 0 && (
        <div className="card">
          <h3>آخر الأخطاء</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>سير العمل</th>
                  <th>الرسالة</th>
                </tr>
              </thead>
              <tbody>
                {stats.errors.recent.map((e) => (
                  <tr key={e.error_id}>
                    <td>{e.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                    <td>{e.workflow}</td>
                    <td className="topic-cell">{e.error_message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
