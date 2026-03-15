import { useState, useEffect } from 'react';
import { useOutletContext, Link, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapServiceRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';

export default function AdminTours() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const refetch = () => {
    supabase.from('services').select('*').then(({ data }) => {
      setTours((data || []).map(mapServiceRow));
    });
  };

  useEffect(() => {
    supabase.from('services').select('*').then(({ data }) => {
      setTours((data || []).map(mapServiceRow));
      setLoading(false);
    });
  }, []);

  const setSuspended = async (e, tourId, suspended) => {
    e?.stopPropagation?.();
    const { error } = await supabase.from('services').update({ suspended: !!suspended }).eq('id', tourId);
    if (error) {
      showToast('Failed: ' + (error.message || 'Unknown'));
      return;
    }
    refetch();
    showToast(suspended ? 'Tour suspended. Hidden from explore.' : 'Tour resumed. Visible in explore again.');
  };

  /** Delete from list only (match app: local state only, no Supabase delete). */
  const handleDelete = (e, tour) => {
    e?.stopPropagation?.();
    setTours((prev) => prev.filter((t) => t.id !== tour.id));
    showToast('Tour removed from list.');
  };

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      {toast && <p style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 1000, fontSize: '0.9rem' }}>{toast}</p>}
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.tours')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>All tours and services.</p>

      <CollapsibleSection title={`Tours (${tours.length})`} icon="🗺️" defaultOpen={false}>
        {tours.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No tours.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {tours.map((s) => (
              <ExpandableItem
                key={s.id}
                summary={
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
                    <span style={{ fontWeight: 600, opacity: s.suspended ? 0.6 : 1 }}>{s.name}{s.suspended ? ' (suspended)' : ''}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{s.provider} · {s.region} · {s.type}</span>
                    <span style={{ color: 'var(--gold)' }}>₾{s.price}</span>
                    <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button type="button" onClick={(ev) => setSuspended(ev, s.id, !s.suspended)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: s.suspended ? 'var(--cyan-soft)' : 'var(--surface)', fontSize: '0.85rem', cursor: 'pointer' }}>{s.suspended ? 'Resume' : 'Suspend'}</button>
                      <button type="button" onClick={(ev) => handleDelete(ev, s)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(224,92,92,.4)', background: 'rgba(224,92,92,.15)', color: 'var(--red)', fontSize: '0.85rem', cursor: 'pointer' }}>Delete</button>
                    </span>
                    <Link to={`/app/tour/${s.id}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>View →</Link>
                  </span>
                }
              >
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 20px' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>ID</dt><dd style={{ margin: 0 }}>{s.id}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Name</dt><dd style={{ margin: 0 }}>{s.name}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Provider</dt><dd style={{ margin: 0 }}>{s.provider}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Region</dt><dd style={{ margin: 0 }}>{s.region}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Type</dt><dd style={{ margin: 0 }}>{s.type}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Duration</dt><dd style={{ margin: 0 }}>{s.duration || '—'}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Price</dt><dd style={{ margin: 0 }}>₾{s.price}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Suspended</dt><dd style={{ margin: 0 }}>{s.suspended ? 'Yes' : 'No'}</dd>
                  {s.desc && <><dt style={{ color: 'var(--text-muted)' }}>Description</dt><dd style={{ margin: 0 }}>{s.desc}</dd></>}
                  <dt style={{ color: 'var(--text-muted)' }}></dt>
                  <dd style={{ margin: 0 }}>
                    <button type="button" onClick={(ev) => handleDelete(ev, s)} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(224,92,92,.4)', background: 'rgba(224,92,92,.15)', color: 'var(--red)', fontSize: '0.85rem', cursor: 'pointer' }}>Delete from list</button>
                  </dd>
                </dl>
              </ExpandableItem>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
