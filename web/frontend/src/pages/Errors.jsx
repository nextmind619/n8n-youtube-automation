import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Errors() {
  const [errors, setErrors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('errors');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.errors(), api.logs()])
      .then(([e, l]) => {
        setErrors(e);
        setLogs(l);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>الأخطاء والسجلات</h2>
        <p>مراقبة مشاكل خط الإنتاج</p>
      </div>

      <div className="actions-row">
        <button
          className={`btn ${tab === 'errors' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('errors')}
        >
          الأخطاء ({errors.length})
        </button>
        <button
          className={`btn ${tab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('logs')}
        >
          السجلات ({logs.length})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : tab === 'errors' ? (
        errors.length === 0 ? (
          <div className="empty">لا توجد أخطاء — ممتاز!</div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الوقت</th>
                    <th>سير العمل</th>
                    <th>العقدة</th>
                    <th>الرسالة</th>
                    <th>إعادة</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e) => (
                    <tr key={e.error_id}>
                      <td>{e.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                      <td>{e.workflow}</td>
                      <td>{e.node_name}</td>
                      <td className="topic-cell" title={e.error_message}>
                        {e.error_message}
                      </td>
                      <td>{e.retry_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : logs.length === 0 ? (
        <div className="empty">لا توجد سجلات</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>المستوى</th>
                  <th>سير العمل</th>
                  <th>الرسالة</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.log_id}>
                    <td>{l.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                    <td>
                      <span className={`badge badge-${l.level === 'error' ? 'failed' : l.level === 'warn' ? 'pending' : 'completed'}`}>
                        {l.level}
                      </span>
                    </td>
                    <td>{l.workflow}</td>
                    <td className="topic-cell">{l.message}</td>
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
