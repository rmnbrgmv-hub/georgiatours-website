import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';

const MANUAL_BADGES = [
  { id: 'verified', icon: '✅', label: 'Verified' },
  { id: 'rising', icon: '⭐', label: 'Rising Star' },
  { id: 'trusted', icon: '🏅', label: 'Trusted Pro' },
  { id: 'toprated', icon: '🏆', label: 'Top Rated' },
  { id: 'elite', icon: '💎', label: 'Elite' },
  { id: 'expertguide', icon: '🗺️', label: 'Expert Guide' },
  { id: 'roadmaster', icon: '🚐', label: 'Road Master' },
  { id: 'highcompletion', icon: '🔁', label: 'High Completion' },
];

function parseBadges(badges) {
  if (Array.isArray(badges)) return badges;
  if (typeof badges === 'string') {
    try { return JSON.parse(badges) || []; } catch (_) { return []; }
  }
  return [];
}

export default function AdminProviders() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState({});
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

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

  const handleAssignBadge = async (provider, badgeId) => {
    if (!badgeId) return;
    let current = parseBadges(provider.badges);
    if (current.includes(badgeId)) {
      showToast('Provider already has this badge');
      return;
    }
    const newBadges = [...current, badgeId];
    const { error } = await supabase.from('users').update({ badges: JSON.stringify(newBadges) }).eq('id', provider.id);
    if (error) {
      showToast('Failed: ' + (error.message || ''));
      return;
    }
    setProviders((prev) => prev.map((p) => (p.id === provider.id ? { ...p, badges: JSON.stringify(newBadges) } : p)));
    setSelectedBadge((prev) => ({ ...prev, [provider.id]: '' }));
    showToast('Badge assigned ✓');
  };

  const handleRemoveBadge = async (provider, badgeId) => {
    let current = parseBadges(provider.badges);
    const newBadges = current.filter((b) => b !== badgeId);
    const { error } = await supabase.from('users').update({ badges: JSON.stringify(newBadges) }).eq('id', provider.id);
    if (error) {
      showToast('Failed: ' + (error.message || ''));
      return;
    }
    setProviders((prev) => prev.map((p) => (p.id === provider.id ? { ...p, badges: JSON.stringify(newBadges) } : p)));
    showToast('Badge removed');
  };

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      {toast && <p style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 1000, fontSize: '0.9rem' }}>{toast}</p>}
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
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Badges</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <select
                      value={selectedBadge[p.id] || ''}
                      onChange={(e) => setSelectedBadge((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                    >
                      <option value="">Select badge…</option>
                      {MANUAL_BADGES.map((b) => (
                        <option key={b.id} value={b.id}>{b.icon} {b.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => handleAssignBadge(p, selectedBadge[p.id])} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(91,141,238,.4)', background: 'rgba(91,141,238,.15)', color: 'var(--blue)', fontSize: '0.85rem', cursor: 'pointer' }}>Assign badge</button>
                  </div>
                  {parseBadges(p.badges).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {parseBadges(p.badges).map((bid) => {
                        const b = MANUAL_BADGES.find((x) => x.id === bid);
                        return b ? (
                          <span key={bid} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: 'var(--surface-hover)', fontSize: '0.85rem' }}>
                            {b.icon} {b.label}
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveBadge(p, bid); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </ExpandableItem>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
