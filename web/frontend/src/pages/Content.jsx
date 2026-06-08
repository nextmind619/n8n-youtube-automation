import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Content() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.content
      .list()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>المحتوى المُنتَج</h2>
        <p>الفيديوهات والأصول المُولَّدة بالذكاء الاصطناعي</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="empty">لا يوجد محتوى بعد — شغّل خط الإنتاج</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الموضوع</th>
                  <th>الحالة</th>
                  <th>Short</th>
                  <th>طويل</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.video_id}>
                    <td className="topic-cell" title={item.viral_title}>
                      {item.viral_title || item.seo_title || '—'}
                    </td>
                    <td className="topic-cell" title={item.topic}>
                      {item.topic}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>{item.status}</span>
                    </td>
                    <td>
                      {item.youtube_short_url ? (
                        <a className="link" href={item.youtube_short_url} target="_blank" rel="noreferrer">
                          مشاهدة
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {item.youtube_long_url ? (
                        <a className="link" href={item.youtube_long_url} target="_blank" rel="noreferrer">
                          مشاهدة
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{item.created_at?.slice(0, 10)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => setSelected(item)}
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selected.viral_title || selected.topic}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>SEO:</strong> {selected.seo_title}</div>
              <div><strong>الوصف:</strong> {selected.seo_description?.slice(0, 200)}...</div>
              <div><strong>الوسوم:</strong> {selected.seo_tags}</div>
              {selected.thumbnail_url && (
                <img src={selected.thumbnail_url} alt="thumbnail" style={{ maxWidth: '100%', borderRadius: 8 }} />
              )}
              {selected.youtube_short_url && (
                <a className="link" href={selected.youtube_short_url} target="_blank" rel="noreferrer">
                  Short على يوتيوب
                </a>
              )}
              {selected.youtube_long_url && (
                <a className="link" href={selected.youtube_long_url} target="_blank" rel="noreferrer">
                  فيديو طويل على يوتيوب
                </a>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
