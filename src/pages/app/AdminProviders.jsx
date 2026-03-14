import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';

export default function AdminProviders() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = (onDone) => {
    supabase.from('users').select('*').eq('role', 'provider').then(({ data }) => {
      setProviders(data || []);
      onDone?.();
    });
  };

  useEffect(() => {
    refetch(() => setLoading(false));
  }, []);

  const setVerified = async (providerId, verified) => {
    const { error } = await supabase.from('users').update({ verified: !!verified }).eq('id', providerId);
    if (!error) refetch();
  };

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.providers')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Guides and drivers.</p>

      <CollapsibleSection title={`Providers (${providers.length})`} icon="👥" defaultOpen={false}>
        {providers.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No providers.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {providers.map((p) => (
              <ExpandableItem
                key={p.id}
                summary={
                  <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ width: 40, height: 40, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{(p.avatar || p.name || '?').slice(0, 2).toUpperCase()}</span>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.provider_type || p.type || '—'}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⭐ {p.rating ?? '—'} · {p.total_bookings ?? 0} bookings</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!p.verified} onChange={(e) => setVerified(p.id, e.target.checked)} />
                      Verified
                    </label>
                  </span>
                }
              >
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 20px' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>ID</dt><dd style={{ margin: 0 }}>{p.id}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Name</dt><dd style={{ margin: 0 }}>{p.name}</dd>
                  {p.email && <><dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd style={{ margin: 0 }}>{p.email}</dd></>}
                  <dt style={{ color: 'var(--text-muted)' }}>Type</dt><dd style={{ margin: 0 }}>{p.provider_type || p.type || '—'}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Rating</dt><dd style={{ margin: 0 }}>{p.rating ?? '—'}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Bookings</dt><dd style={{ margin: 0 }}>{p.total_bookings ?? 0}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Verified</dt><dd style={{ margin: 0 }}>{p.verified ? 'Yes' : 'No'}</dd>
                  {p.bio && <><dt style={{ color: 'var(--text-muted)' }}>Bio</dt><dd style={{ margin: 0 }}>{p.bio}</dd></>}
                </dl>
              </ExpandableItem>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
