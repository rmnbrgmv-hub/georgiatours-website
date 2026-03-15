import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { mapBookingRow } from '../hooks/useAppData';
import ExpandableItem from '../components/ExpandableItem';

const statusRank = { completed: 4, tourist_done: 3, provider_done: 3, confirmed: 2, active: 2, cancelled: 0 };

function ReviewModal({ booking, onSubmit, onClose }) {
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 4 }}>Leave a Review</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>{booking?.service} with {booking?.provider}</p>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Rating</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setStars(n)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 4 }}>{n <= stars ? '★' : '☆'}</button>
          ))}
        </div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Your review (optional)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Share your experience…" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', marginBottom: 20, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={() => onSubmit(stars, text)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--gold)', color: 'var(--bg)', fontWeight: 600, cursor: 'pointer' }}>Submit ★</button>
        </div>
      </div>
    </div>
  );
}

export default function Bookings() {
  const { user } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
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

  const handleConfirmCompletion = async (bookingId) => {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
    if (!error) setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b)));
  };

  const handleReview = async (booking, stars, text) => {
    const providerId = booking.providerId ?? booking.provider_id;
    await supabase.from('bookings').update({ reviewed: true }).eq('id', booking.id);
    if (providerId) {
      await supabase.from('reviews').insert({
        provider_id: providerId,
        rating: stars,
        text: (text || '').trim() || null,
        tourist_name: user?.name || 'Guest',
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, reviewed: true } : b)));
    setReviewTarget(null);
  };

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>Sign in to see your bookings.</p>
        <Link to="/login?redirect=/app/bookings" style={{ color: 'var(--gold)' }}>Sign in</Link>
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
          <Link to="/app/explore" style={{ color: 'var(--gold)', fontWeight: 500 }}>Explore tours</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookings.map((b) => (
            <ExpandableItem
              key={b.id}
              summary={
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
                  <span style={{ fontWeight: 600 }}>{b.service}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{b.date}</span>
                  <span style={{ fontFamily: 'var(--font-classic)', color: 'var(--gold)' }}>₾{b.amount}</span>
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
                </span>
              }
            >
              <p style={{ margin: '0 0 12px', color: 'var(--text-muted)' }}><strong>Provider:</strong> {b.provider}</p>
              <p style={{ margin: '0 0 12px' }}><strong>Date:</strong> {b.date} · <strong>Amount:</strong> ₾{b.amount}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {['confirmed', 'active'].includes(b.status) && (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(b.id)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Mark complete
                  </button>
                )}
                {b.status === 'provider_done' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmCompletion(b.id)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Confirm completion
                  </button>
                )}
                {b.status === 'completed' && !b.reviewed && (
                  <button type="button" onClick={() => setReviewTarget(b)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gold)', background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: '0.85rem', cursor: 'pointer' }}>★ Leave a Review</button>
                )}
                {b.status === 'completed' && b.reviewed && <span style={{ fontSize: '0.85rem', color: 'var(--cyan)' }}>✓ Reviewed</span>}
                <Link to="/app/chat" style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: '0.85rem', textDecoration: 'none' }}>Chat with provider</Link>
              </div>
            </ExpandableItem>
          ))}
        </div>
      )}
      {reviewTarget && <ReviewModal booking={reviewTarget} onSubmit={(stars, text) => handleReview(reviewTarget, stars, text)} onClose={() => setReviewTarget(null)} />}
    </div>
  );
}
