import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function Bookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('bookings')
      .select('*')
      .eq('tourist_id', user.id)
      .then(({ data }) => {
        setBookings(
          (data || []).map((r) => ({
            id: r.id,
            service: r.service_name,
            date: r.date,
            amount: r.amount,
            status: r.status,
          }))
        );
        setLoading(false);
      });
  }, [user?.id]);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: 'var(--font-classic)', fontSize: '1.2rem', color: 'var(--gold)' }}>₾{b.amount}</span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: b.status === 'completed' ? 'var(--cyan-soft)' : 'var(--gold-soft)',
                    color: b.status === 'completed' ? 'var(--cyan)' : 'var(--gold)',
                  }}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
