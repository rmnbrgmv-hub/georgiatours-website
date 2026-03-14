import { useState, useEffect } from 'react';
import { useOutletContext, Link, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapServiceRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';

export default function ProviderTours() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('services')
      .select('*')
      .eq('provider_id', user.id)
      .then(({ data }) => {
        setTours((data || []).map(mapServiceRow));
        setLoading(false);
      });
  }, [user?.id]);

  if (!user) return null;
  if (user.role !== 'provider') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.myTours')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Tours and services you offer.</p>

      {tours.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No tours yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {tours.map((s) => (
            <div key={s.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ background: 'var(--gold-soft)', color: 'var(--gold)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{s.type}</span>
              <h3 style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>{s.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 8 }}>{s.region} · {s.duration}</p>
              <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.25rem', color: 'var(--gold)' }}>₾{s.price}</p>
              <Link to={`/tour/${s.id}`} style={{ display: 'inline-block', marginTop: 12, color: 'var(--gold)', fontSize: '0.9rem' }}>View →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
