import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapRequestRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

export default function AdminRequests() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setRequests((data || []).map(mapRequestRow));
      setLoading(false);
    });
  }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.requests')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>All trip requests.</p>

      <CollapsibleSection title={`Requests (${requests.length})`} icon="📋" defaultOpen={false}>
        {requests.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No requests.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((r) => (
              <div key={r.id} className="glass" style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.tourist} · {r.region} · {r.type} · {r.date} · ₾{r.budget}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: 'var(--gold-soft)', color: 'var(--gold)' }}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
