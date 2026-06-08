import { useEffect, useState } from 'react';
import { api } from '../api';

const STATUS_LABELS = {
  pending: 'معلق',
  processing: 'قيد المعالجة',
  completed: 'مكتمل',
  failed: 'فشل',
  retry: 'إعادة',
};

export default function Queue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ topic: '', priority: 5, source: 'manual' });
  const [msg, setMsg] = useState('');

  function load() {
    setLoading(true);
    api.queue
      .list()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api.queue.create(form);
      setForm({ topic: '', priority: 5, source: 'manual' });
      setShowForm(false);
      setMsg('تمت إضافة الموضوع للطابور');
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function handleStatusChange(queueId, status) {
    try {
      await api.queue.update(queueId, { status });
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>طابور الإنتاج</h2>
        <p>إدارة مواضيع الفيديوهات المجدولة</p>
      </div>

      <div className="actions-row">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + إضافة موضوع
        </button>
        <button className="btn btn-secondary" onClick={load}>
          تحديث
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('تم') ? 'alert-success' : 'alert-error'}`}>{msg}</div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>إضافة موضوع جديد</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>الموضوع</label>
                <textarea
                  rows={3}
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="مثال: كيف تربط n8n مع Google Sheets"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>الأولوية (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>المصدر</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    <option value="manual">يدوي</option>
                    <option value="seed">seed</option>
                    <option value="reddit_n8n">reddit</option>
                    <option value="ai_generated">AI</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  إضافة
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="empty">الطابور فارغ — أضف موضوعاً للبدء</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>الموضوع</th>
                  <th>المصدر</th>
                  <th>الأولوية</th>
                  <th>مجدول</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.queue_id}>
                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="topic-cell" title={item.topic}>
                      {item.topic}
                    </td>
                    <td>{item.source}</td>
                    <td>{item.priority}</td>
                    <td>{item.scheduled_at?.slice(0, 16).replace('T', ' ')}</td>
                    <td>
                      {item.status === 'failed' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleStatusChange(item.queue_id, 'pending')}
                        >
                          إعادة
                        </button>
                      )}
                    </td>
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
