import { useState, useEffect } from 'react';
import { useOutletContext, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapServiceRow, mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';
import { parseJsonArray } from '../../utils/supabaseMappers';

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

  const [toursByProviderId, setToursByProviderId] = useState({});
  const [bookingsByProviderId, setBookingsByProviderId] = useState({});

  const refetch = (onDone) => {
    supabase.from('users').select('*').eq('role', 'provider').then(({ data }) => {
      setProviders(data || []);
      onDone?.();
    });
  };

  useEffect(() => {
    refetch();
    supabase.from('services').select('*').then(({ data }) => {
      const byProvider = {};
      (data || []).forEach((row) => {
        const pid = row.provider_id;
        if (!byProvider[pid]) byProvider[pid] = [];
        byProvider[pid].push(mapServiceRow(row));
      });
      setToursByProviderId(byProvider);
    });
    supabase.from('bookings').select('*').then(({ data }) => {
      const byProvider = {};
      (data || []).forEach((row) => {
        const pid = row.provider_id;
        if (!byProvider[pid]) byProvider[pid] = [];
        byProvider[pid].push(mapBookingRow(row));
      });
      setBookingsByProviderId(byProvider);
    });
  }, []);

  useEffect(() => {
    if (providers.length > 0) setLoading(false);
  }, [providers.length]);

  const setVerified = async (providerId, verified) => {
    const { error } = await supabase.from('users').update({ verified: !!verified }).eq('id', providerId);
    if (!error) refetch();
  };

  const handleAssignBadge = async (provider, badgeId) => {
    if (!badgeId) return;
    let current = parseJsonArray(provider.badges);
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
    let current = parseJsonArray(provider.badges);
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
                    {p.profile_picture ? (
                      <img src={p.profile_picture} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ width: 40, height: 40, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{(p.avatar || p.name || '?').slice(0, 2).toUpperCase()}</span>
                    )}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.provider_type || p.type || '—'}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⭐ {p.rating ?? '—'} · {p.total_bookings ?? 0} bookings</span>
                    <Link to={`/app/admin-provider/${p.id}`} onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--gold)', background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Profile & jobs</Link>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!p.verified} onChange={(e) => setVerified(p.id, e.target.checked)} />
                      Verified
                    </label>
                  </span>
                }
              >
                <div style={{ marginBottom: 16 }}>
                  <Link to={`/app/admin-provider/${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gold)', background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>View full profile, tours & jobs →</Link>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                  {p.profile_picture ? (
                    <img src={p.profile_picture} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 96, height: 96, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.5rem' }}>{(p.avatar || p.name || '?').slice(0, 2).toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
                      <dt style={{ color: 'var(--text-muted)' }}>ID</dt><dd style={{ margin: 0 }}>{p.id}</dd>
                      <dt style={{ color: 'var(--text-muted)' }}>Name</dt><dd style={{ margin: 0 }}>{p.name}</dd>
                      {p.email && <><dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd style={{ margin: 0 }}>{p.email}</dd></>}
                      <dt style={{ color: 'var(--text-muted)' }}>Type</dt><dd style={{ margin: 0 }}>{p.provider_type || p.type || '—'}</dd>
                      <dt style={{ color: 'var(--text-muted)' }}>Rating</dt><dd style={{ margin: 0 }}>⭐ {p.rating ?? '—'}</dd>
                      <dt style={{ color: 'var(--text-muted)' }}>Total bookings</dt><dd style={{ margin: 0 }}>{p.total_bookings ?? 0}</dd>
                      {p.earnings != null && <><dt style={{ color: 'var(--text-muted)' }}>Earnings</dt><dd style={{ margin: 0 }}>{p.earnings}</dd></>}
                      <dt style={{ color: 'var(--text-muted)' }}>Verified</dt><dd style={{ margin: 0 }}>{p.verified ? 'Yes' : 'No'}</dd>
                      {p.vehicle_make && <><dt style={{ color: 'var(--text-muted)' }}>Vehicle</dt><dd style={{ margin: 0 }}>{p.vehicle_make} {p.vehicle_model || ''} {p.vehicle_year || ''} {p.vehicle_plate ? `· ${p.vehicle_plate}` : ''}</dd></>}
                      {p.max_seats != null && <><dt style={{ color: 'var(--text-muted)' }}>Max seats</dt><dd style={{ margin: 0 }}>{p.max_seats}</dd></>}
                      {p.bio && <><dt style={{ color: 'var(--text-muted)' }}>Bio</dt><dd style={{ margin: 0 }}>{p.bio}</dd></>}
                    </dl>
                  </div>
                </div>
                {parseJsonArray(p.gallery).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Gallery</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {parseJsonArray(p.gallery).map((src, i) => (
                        <div key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', background: 'var(--s2, #1a1a2e)' }}>
                          <img src={typeof src === 'object' && src?.base64 ? src.base64 : src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, background: 'var(--s2, #1a1a2e)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {((toursByProviderId[p.id] || []).length > 0) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Tours ({toursByProviderId[p.id].length})</div>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {(toursByProviderId[p.id] || []).map((t) => (
                        <li key={t.id} style={{ marginBottom: 4 }}>
                          <Link to={`/app/tour/${t.id}?from=admin-provider&fromProvider=${p.id}`} state={{ fromAdminProvider: true, providerId: p.id }} style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{t.name}</Link>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> · {t.region} · ₾{t.price} {t.suspended ? '(suspended)' : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {((bookingsByProviderId[p.id] || []).length > 0) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Jobs / Bookings ({bookingsByProviderId[p.id].length})</div>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {(bookingsByProviderId[p.id] || []).slice(0, 15).map((b) => (
                        <li key={b.id} style={{ marginBottom: 4, fontSize: '0.9rem' }}><Link to={`/app/admin-booking/${b.id}`} style={{ color: 'var(--gold)', textDecoration: 'none', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>{b.tourist} · {b.service} · {b.date} · ₾{b.amount} · {b.status}</Link></li>
                      ))}
                      {(bookingsByProviderId[p.id] || []).length > 15 && <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>+{(bookingsByProviderId[p.id].length - 15)} more</li>}
                    </ul>
                  </div>
                )}
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
                  {parseJsonArray(p.badges).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {parseJsonArray(p.badges).map((bid) => {
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); showToast('Warning sent to ' + p.name); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(201,168,76,.4)', background: 'rgba(201,168,76,.15)', color: 'var(--gold)', fontSize: '0.85rem', cursor: 'pointer' }}>Send Warning</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); showToast(p.name + ' suspended'); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(224,92,92,.4)', background: 'rgba(224,92,92,.15)', color: 'var(--red)', fontSize: '0.85rem', cursor: 'pointer' }}>Suspend</button>
                  </div>
                </div>
              </ExpandableItem>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
