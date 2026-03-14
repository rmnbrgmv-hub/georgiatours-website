import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { mapBookingRow } from '../hooks/useAppData';

const statusRank = { completed: 4, tourist_done: 3, provider_done: 3, confirmed: 2, active: 2, cancelled: 0 };

export default function Bookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const completedBookingIds = useRef(new Set());

  useEffect(() => {
    if (!user?.id) return;
    const map = (row) => mapBookingRow(row);
    const tick = async () => {
      const { data } = await supabase.from('bookings').select('*').eq('tourist_id', user.id);
      const fetched = (data || []).map(map);
      fetched.forEach((b) => { if (b.status === 'completed') completedBookingIds.current.add(b.id); });
      setBookings((prev) =>
        fetched.map((newB) => {
          if (completedBookingIds.current.has(newB.id)) return prev.find((x) => x.id === newB.id) || newB;
          const existing = prev.find((x) => x.id === newB.id);
          if (existing && statusRank[existing.status] >= statusRank[newB.status]) return existing;
          return newB;
        })
      );
      setLoading(false);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [user?.id]);

  const handleMarkComplete = async (bookingId) => {
    const { error } = await supabase.from('bookings').update({ status: 'tourist_done' }).eq('id', bookingId);
    if (!error) setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'tourist_done' } : b)));
  };

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>Sign in to see your bookings.</p>
        <Link to="/login?redirect=/bookings" style={{ color: 'var(--gold)' }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 8 }}>
        Your bookings
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Same data as in the app.</p>
      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No bookings yet.</p>
          <Link to="/explore" style={{ color: 'var(--gold)', fontWeight: 500 }}>Explore tours</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map((b) => (
            <div
              key={b.id}
              className="glass"
              style={{
                padding: 20,
                borderRadius: 'var(--radius)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{b.service}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{b.date}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-classic)', fontSize: '1.2rem', color: 'var(--gold)' }}>₾{b.amount}</span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: b.status === 'completed' ? 'var(--cyan-soft)' : b.status === 'tourist_done' ? 'var(--surface-hover)' : 'var(--gold-soft)',
                    color: b.status === 'completed' ? 'var(--cyan)' : b.status === 'tourist_done' ? 'var(--text-muted)' : 'var(--gold)',
                  }}
                >
                  {b.status}
                </span>
                {['confirmed', 'active'].includes(b.status) && (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(b.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
