import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';
import ExpandableItem from '../../components/ExpandableItem';

export default function AdminBookings() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setBookings((data || []).map(mapBookingRow));
    });
  };

  useEffect(() => {
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setBookings((data || []).map(mapBookingRow));
      setLoading(false);
    });
  }, []);

  const isStuck48h = (b) => {
    if (!['provider_done', 'tourist_done'].includes(b.status)) return false;
    const ts = b.updated_at || b.createdAt;
    if (!ts) return false;
    return Date.now() - new Date(ts).getTime() > 48 * 60 * 60 * 1000;
  };
  const stuckBookings = bookings.filter(isStuck48h);

  const forceCompleteBooking = async (b) => {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', b.id);
    if (!error) refetch();
  };

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>{t('nav.bookings')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>All bookings.</p>

      {stuckBookings.length > 0 && (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 'var(--radius)', border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)' }}>
          <strong style={{ color: 'var(--gold)' }}>⚠️ Awaiting confirmation 48h+</strong>
          <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stuckBookings.length} booking(s) in provider_done/tourist_done over 48 hours.</span>
        </div>
      )}

      <CollapsibleSection title={`Bookings (${bookings.length})`} icon="📅" defaultOpen={false}>
        {bookings.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {bookings.map((b) => (
              <ExpandableItem
                key={b.id}
                summary={
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
                    <span style={{ fontWeight: 600 }}>{b.service}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{b.tourist} → {b.provider}</span>
                    <span>{b.date}</span>
                    <span style={{ color: 'var(--gold)' }}>₾{b.amount}</span>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: 'var(--gold-soft)', color: 'var(--gold)' }}>{b.status}</span>
                    {isStuck48h(b) && <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', fontWeight: 600 }}>⚠️ 48h+</span>}
                  </span>
                }
              >
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 20px' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>ID</dt><dd style={{ margin: 0 }}>{b.id}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Tourist</dt><dd style={{ margin: 0 }}>{b.tourist}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Service</dt><dd style={{ margin: 0 }}>{b.service}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Provider</dt><dd style={{ margin: 0 }}>{b.provider}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Date</dt><dd style={{ margin: 0 }}>{b.date}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Amount</dt><dd style={{ margin: 0 }}>₾{b.amount}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Status</dt><dd style={{ margin: 0 }}>{b.status}</dd>
                  <dt style={{ color: 'var(--text-muted)' }}>Reviewed</dt><dd style={{ margin: 0 }}>{b.reviewed ? 'Yes' : 'No'}</dd>
                  {b.createdAt && <><dt style={{ color: 'var(--text-muted)' }}>Created</dt><dd style={{ margin: 0 }}>{new Date(b.createdAt).toLocaleString()}</dd></>}
                  {b.status !== 'completed' && (
                    <><dt style={{ color: 'var(--text-muted)' }}></dt><dd style={{ margin: 0 }}>
                      <button type="button" onClick={() => forceCompleteBooking(b)} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Force complete</button>
                    </dd></>
                  )}
                </dl>
              </ExpandableItem>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
