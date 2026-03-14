import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';

export default function AdminProviders() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('users').select('*').eq('role', 'provider').then(({ data }) => {
      setProviders(data || []);
      setLoading(false);
    });
  }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.providers')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Guides and drivers.</p>

      {providers.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No providers.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {providers.map((p) => (
            <div key={p.id} className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{(p.avatar || p.name || '?').slice(0, 2).toUpperCase()}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.provider_type || p.type || '—'}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⭐ {p.rating ?? '—'} · {p.total_bookings ?? 0} bookings</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
