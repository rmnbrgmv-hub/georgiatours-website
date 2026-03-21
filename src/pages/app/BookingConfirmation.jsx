import { useSearchParams, Link } from 'react-router-dom';

export default function BookingConfirmation() {
  const [params] = useSearchParams();
  const tour = params.get('tour') || 'your tour';
  const date = params.get('date') || '';
  const price = params.get('price') || '';

  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>✅</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
        Booking Confirmed!
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 32 }}>
        Your booking for <strong style={{ color: 'var(--text)' }}>{tour}</strong>
        {date && <> on <strong style={{ color: 'var(--text)' }}>{date}</strong></>}
        {price && <> for <strong style={{ color: 'var(--gold)' }}>₾{price}</strong></>}
        {' '}has been submitted. The provider will confirm shortly.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/app/bookings"
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            background: 'var(--gold)',
            color: 'var(--bg)',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}
        >
          View My Bookings
        </Link>
        <Link
          to="/app/explore"
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}
        >
          Explore More Tours
        </Link>
      </div>

      <div style={{ marginTop: 48, padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>What happens next?</h3>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>The provider will review and confirm your booking</li>
          <li>You'll be able to chat with them for any questions</li>
          <li>On the tour day, your guide/driver will be ready</li>
          <li>After the tour, you can leave a review</li>
        </ul>
      </div>
    </div>
  );
}
