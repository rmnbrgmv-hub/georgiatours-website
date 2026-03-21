import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';
import { parseJsonArray } from '../../utils/supabaseMappers';
import { getUserSettingsFromBadges } from '../../utils/providerSettings';

export default function AdminApprovals() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const refetch = async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'provider');
    const list = data || [];
    setPending(list.filter((p) => !p.verified));
    setApproved(list.filter((p) => p.verified));
    setLoading(false);
  };

  useEffect(() => { refetch(); }, []);

  const handleApprove = async (provider) => {
    const { error } = await supabase.from('users').update({ verified: true }).eq('id', provider.id);
    if (error) { showToast('Failed: ' + error.message); return; }
    refetch();
    showToast(`${provider.name} approved ✓`);
  };

  const handleReject = async (provider) => {
    const { error } = await supabase.from('users').update({ verified: false, role: 'tourist' }).eq('id', provider.id);
    if (error) { showToast('Failed: ' + error.message); return; }
    refetch();
    showToast(`${provider.name} rejected`);
  };

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;

  return (
    <div>
      {toast && <p style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 1000, fontSize: '0.9rem' }}>{toast}</p>}
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.approvals')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Review and approve new providers.</p>

      <CollapsibleSection title={`Pending Approval (${pending.length})`} icon="⏳" defaultOpen={true}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading…</div>
        ) : pending.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No pending approvals. All providers are verified.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {pending.map((p) => {
              const settings = getUserSettingsFromBadges(p.badges);
              return (
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
                      <span style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: 6, background: p.provider_type === 'guide' ? 'rgba(91,141,238,.15)' : 'rgba(201,168,76,.15)', color: p.provider_type === 'guide' ? '#5b8dee' : 'var(--gold)' }}>{p.provider_type === 'guide' ? '🗺️ Guide' : '🚐 Driver'}</span>
                      {settings.provider_mode === 'company' && <span style={{ fontSize: '0.8rem', color: 'var(--cyan)', padding: '2px 8px', borderRadius: 6, background: 'var(--cyan-soft)' }}>Company · {settings.team_size} members</span>}
                      <span onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => handleApprove(p)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Approve</button>
                        <button type="button" onClick={() => handleReject(p)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(224,92,92,.4)', background: 'rgba(224,92,92,.15)', color: 'var(--red, #e05c5c)', fontSize: '0.85rem', cursor: 'pointer' }}>Reject</button>
                      </span>
                    </span>
                  }
                >
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
                        <dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd style={{ margin: 0 }}>{p.email || '—'}</dd>
                        <dt style={{ color: 'var(--text-muted)' }}>Type</dt><dd style={{ margin: 0 }}>{p.provider_type === 'guide' ? 'Guide' : 'Driver/Transfer'}</dd>
                        <dt style={{ color: 'var(--text-muted)' }}>Mode</dt><dd style={{ margin: 0 }}>{settings.provider_mode === 'company' ? `Company: ${settings.company_name || '—'} (${settings.team_size} members)` : 'Individual'}</dd>
                        {p.bio && <><dt style={{ color: 'var(--text-muted)' }}>Bio</dt><dd style={{ margin: 0 }}>{p.bio}</dd></>}
                        {p.vehicle_make && <><dt style={{ color: 'var(--text-muted)' }}>Vehicle</dt><dd style={{ margin: 0 }}>{p.vehicle_make} {p.vehicle_model} {p.vehicle_year} {p.vehicle_color} · {p.vehicle_plate}</dd></>}
                        {p.max_seats != null && <><dt style={{ color: 'var(--text-muted)' }}>Max Seats</dt><dd style={{ margin: 0 }}>{p.max_seats}</dd></>}
                      </dl>
                    </div>
                    {parseJsonArray(p.gallery).length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Gallery</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {parseJsonArray(p.gallery).map((src, i) => (
                            <img key={i} src={typeof src === 'object' && src?.base64 ? src.base64 : src} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: 'var(--surface)' }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ExpandableItem>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      <div style={{ marginTop: 32 }}>
        <CollapsibleSection title={`Approved (${approved.length})`} icon="✅" defaultOpen={false}>
          {approved.length === 0 ? (
            <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No approved providers yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {approved.map((p) => (
                <ExpandableItem
                  key={p.id}
                  summary={
                    <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <span style={{ width: 32, height: 32, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem' }}>{(p.avatar || p.name || '?').slice(0, 2).toUpperCase()}</span>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.provider_type === 'guide' ? '🗺️ Guide' : '🚐 Driver'} · ⭐ {p.rating ?? '—'} · {p.total_bookings ?? 0} bookings</span>
                      <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(76,175,80,.15)', color: '#4CAF50' }}>✓ Verified</span>
                    </span>
                  }
                >
                  <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
                    <dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd style={{ margin: 0 }}>{p.email || '—'}</dd>
                    <dt style={{ color: 'var(--text-muted)' }}>Earnings</dt><dd style={{ margin: 0 }}>{p.earnings ?? '—'}</dd>
                  </dl>
                </ExpandableItem>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
