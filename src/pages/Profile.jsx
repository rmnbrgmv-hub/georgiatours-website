import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapBookingRow } from '../hooks/useAppData';

export default function Profile() {
  const { user } = useOutletContext();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('bookings')
      .select('*')
      .eq('tourist_id', user.id)
      .then(({ data }) => setBookings((data || []).map(mapBookingRow)));
  }, [user?.id]);

  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>{t('tour.signInToBook')}</p>
        <Link to="/login?redirect=/app/profile" style={{ color: 'var(--gold)' }}>{t('nav.signIn')}</Link>
      </div>
    );
  }

  const completed = bookings.filter((b) => b.status === 'completed').length;
  const reviewsLeft = bookings.filter((b) => b.status === 'completed' && !b.reviewed).length;

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', marginBottom: 4 }}>{t('profile.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{t('profile.subtitle')}</p>

      <div className="glass" style={{ padding: 28, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: user.color || 'var(--gold)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.5rem',
            }}
          >
            {(user.avatar || user.name || '').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 4 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--surface-hover)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 600 }}>{bookings.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.bookings')}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--surface-hover)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.5rem', color: 'var(--cyan)', fontWeight: 600 }}>{completed}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.completed')}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--surface-hover)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-classic)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 600 }}>{reviewsLeft}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.reviewsLeft')}</div>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 20 }}>{t('profile.memberSince')} Mar 2024</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/app/chat', { state: { openSupport: true } })}
          style={{
            display: 'block',
            width: '100%',
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
          }}
        >
          💬 Message Support
        </button>
        <Link
          to="/app/bookings"
          style={{
            display: 'block',
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 500,
          }}
        >
          📅 {t('nav.bookings')}
        </Link>
        <Link
          to="/app/requests"
          style={{
            display: 'block',
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontWeight: 500,
          }}
        >
          📢 {t('nav.requests')}
        </Link>
      </div>
    </div>
  );
}
