import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';

export default function AdminBookingDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('bookings').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setBooking(data ? mapBookingRow(data) : null);
      setLoading(false);
    });
  }, [id]);

  const forceComplete = async () => {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', id);
    if (!error) setBooking((b) => b ? { ...b, status: 'completed' } : b);
  };

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;
  if (!booking) return <div style={{ color: 'var(--text-muted)' }}>Booking not found.</div>;

  const b = booking;
  return (
    <div style={{ maxWidth: 600 }}>
      <Link to="/app/admin-bookings" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, textDecoration: 'none' }}>
        ← Back to bookings
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>Booking details</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>ID: {b.id}</p>

      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 20px' }}>
        <dt style={{ color: 'var(--text-muted)' }}>Tourist</dt><dd style={{ margin: 0 }}>{b.tourist}</dd>
        <dt style={{ color: 'var(--text-muted)' }}>Service</dt><dd style={{ margin: 0 }}>{b.service}</dd>
        <dt style={{ color: 'var(--text-muted)' }}>Provider</dt><dd style={{ margin: 0 }}><Link to={`/app/admin-provider/${b.providerId}`} style={{ color: 'var(--gold)' }}>{b.provider}</Link></dd>
        <dt style={{ color: 'var(--text-muted)' }}>Date</dt><dd style={{ margin: 0 }}>{b.date}</dd>
        <dt style={{ color: 'var(--text-muted)' }}>Amount</dt><dd style={{ margin: 0 }}>₾{b.amount}</dd>
        <dt style={{ color: 'var(--text-muted)' }}>Status</dt><dd style={{ margin: 0 }}>{b.status}</dd>
        <dt style={{ color: 'var(--text-muted)' }}>Reviewed</dt><dd style={{ margin: 0 }}>{b.reviewed ? 'Yes' : 'No'}</dd>
        {b.createdAt && <><dt style={{ color: 'var(--text-muted)' }}>Created</dt><dd style={{ margin: 0 }}>{new Date(b.createdAt).toLocaleString()}</dd></>}
      </dl>

      {b.status !== 'completed' && (
        <div style={{ marginTop: 24 }}>
          <button type="button" onClick={forceComplete} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Force complete</button>
        </div>
      )}
    </div>
  );
}
