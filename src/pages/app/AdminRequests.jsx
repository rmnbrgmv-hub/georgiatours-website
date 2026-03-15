import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapRequestRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';

export default function AdminRequests() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [requests, setRequests] = useState([]);
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    supabase.from('requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setRequests((data || []).map(mapRequestRow));
    });
  };

  useEffect(() => {
    supabase.from('requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setRequests((data || []).map(mapRequestRow));
      setLoading(false);
    });
    supabase.from('offers').select('*').then(({ data }) => {
      const byRequest = {};
      (data || []).forEach((o) => {
        const rid = o.request_id;
        if (!byRequest[rid]) byRequest[rid] = [];
        byRequest[rid].push({
          id: o.id,
          provider_id: o.provider_id,
          provider_name: o.provider_name,
          price: o.price,
          description: o.description,
          status: o.status,
        });
      });
      setOffersByRequestId(byRequest);
    });
  }, []);

  const forceCompleteRequest = async (r) => {
    const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', r.id);
    if (!error) refetch();
  };

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {requests.map((r) => (
              <ExpandableItem
                key={r.id}
                summary={
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
                    <span style={{ fontWeight: 600 }}>{r.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.tourist} · {r.region} · {r.type}</span>
                    <span>{r.date}</span>
                    <span style={{ color: 'var(--gold)' }}>₾{r.budget}</span>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: 'var(--gold-soft)', color: 'var(--gold)' }}>{r.status}</span>
                  </span>
                }
              >
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 20px' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>ID</dt><dd style={{ margin: 0 }}>{r.id}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Title</dt><dd style={{ margin: 0 }}>{r.title || '—'}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Tourist</dt><dd style={{ margin: 0 }}>{r.tourist}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Region</dt><dd style={{ margin: 0 }}>{r.region}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Type</dt><dd style={{ margin: 0 }}>{r.type}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Date</dt><dd style={{ margin: 0 }}>{r.date || '—'}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Budget</dt><dd style={{ margin: 0 }}>₾{r.budget ?? '—'}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Status</dt><dd style={{ margin: 0 }}>{r.status}</dd>
                  {r.createdAt && <><dt style={{ color: 'var(--text-muted)' }}>Created</dt><dd style={{ margin: 0 }}>{new Date(r.createdAt).toLocaleString()}</dd></>}
                  {r.desc && <><dt style={{ color: 'var(--text-muted)' }}>Description</dt><dd style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '100%' }}>{r.desc}</dd></>}
                </dl>
                {((offersByRequestId[r.id] || []).length > 0) && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Offers ({(offersByRequestId[r.id] || []).length})</div>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {(offersByRequestId[r.id] || []).map((o) => (
                        <li key={o.id} style={{ marginBottom: 8, fontSize: '0.9rem' }}>
                          <strong>{o.provider_name || 'Provider'}</strong> · ₾{o.price} · <span style={{ color: 'var(--text-muted)' }}>{o.status || '—'}</span>
                          {o.description && <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.description}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.status !== 'completed' && (
                  <div style={{ marginTop: 16 }}>
                    <button type="button" onClick={() => forceCompleteRequest(r)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Force complete</button>
                  </div>
                )}
              </ExpandableItem>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
