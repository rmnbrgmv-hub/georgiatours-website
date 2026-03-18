import { useParams, Link, useOutletContext, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { mapServiceRow } from '../hooks/useAppData';
import { bookingInsertFromTour, photoUrl } from '../utils/supabaseMappers';
import {
  getUserSettingsFromBadges,
  getAvailabilityStatusForDate,
  getDailyCapacity,
  buildBadgesWithSettings,
} from '../utils/providerSettings';

export default function Tour(props) {
  const { t } = useLocale();
  const outlet = useOutletContext?.();
  const user = outlet?.user ?? props?.user;
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inApp = location.pathname.startsWith('/app');
  const fromAdminProviderId = location.state?.providerId ?? searchParams.get('fromProvider');
  const fromAdminProvider = (location.state?.fromAdminProvider || searchParams.get('from') === 'admin-provider') && fromAdminProviderId;
  const fromAdminTours = location.state?.fromAdminTours || searchParams.get('from') === 'admin-tours';
  const backToProviderPath = fromAdminProvider ? `/app/admin-provider/${fromAdminProviderId}` : null;
  const backToAdminToursPath = fromAdminTours ? '/app/admin-tours' : null;
  const explorePath = inApp ? '/app/explore' : '/explore';
  const backPath = backToProviderPath || backToAdminToursPath || explorePath;
  const backLabel = backToProviderPath ? 'Back to provider' : backToAdminToursPath ? 'Back to tours' : (t && t('tour.backToExplore')) || 'Back to Explore';
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setTour(null);
          setLoading(false);
          return;
        }
        const showSuspended = user?.role === 'admin';
        if (data && (showSuspended || !data.suspended)) {
          const mappedTour = mapServiceRow(data);
          setTour(mappedTour);
          if (data.provider_id) {
            supabase
              .from('reviews')
              .select('rating, text, tourist_name, date, created_at')
              .eq('provider_id', data.provider_id)
              .order('created_at', { ascending: false })
              .limit(10)
              .then(({ data: rev }) => setReviews(rev || []));
            supabase
              .from('users')
              .select('badges')
              .eq('id', data.provider_id)
              .maybeSingle()
              .then(({ data: providerRow }) => {
                if (!providerRow) return;
                const settings = getUserSettingsFromBadges(providerRow.badges);
                const status = getAvailabilityStatusForDate(settings, bookingDate);
                setAvailabilityStatus(status);
              });
          }
        } else {
          setTour(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setTour(null);
        setLoading(false);
      });
  }, [id, user?.role]);

  useEffect(() => {
    const pid = tour?.providerId ?? tour?.provider_id;
    if (!pid || !bookingDate) return;
    supabase
      .from('users')
      .select('badges')
      .eq('id', pid)
      .maybeSingle()
      .then(({ data: providerRow }) => {
        if (!providerRow) return;
        const settings = getUserSettingsFromBadges(providerRow.badges);
        setAvailabilityStatus(getAvailabilityStatusForDate(settings, bookingDate));
      });
  }, [tour?.providerId, tour?.provider_id, bookingDate]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (!tour) return <div style={{ padding: 80, textAlign: 'center' }}>{(t && t('tour.notFound')) || 'Tour not found.'} <Link to={backPath}>{backLabel}</Link></div>;

  const mainPhoto = photoUrl(tour.photos?.[photoIndex]);
  const description = tour.desc ?? tour.description;
  const isAskForPrice = tour.price == null || Number(tour.price) <= 0;

  const handleBook = async () => {
    if (!user?.id || booking) return;
    const providerId = tour.providerId ?? tour.provider_id;
    if (!providerId) {
      setBookError('Provider not set for this tour.');
      return;
    }
    setBookError('');
    setBooking(true);
    try {
      const { data: providerRow } = await supabase
        .from('users')
        .select('badges')
        .eq('id', providerId)
        .maybeSingle();
      const settings = getUserSettingsFromBadges(providerRow?.badges);
      const status = getAvailabilityStatusForDate(settings, bookingDate);
      if (!status.available) {
        setBooking(false);
        setBookError(status.text || 'Provider not available on this date');
        return;
      }

      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('date', bookingDate)
        .eq('status', 'confirmed');

      const capacity = getDailyCapacity(settings);
      if ((count ?? 0) >= capacity) {
        setBooking(false);
        setBookError('Provider fully booked on this date');
        return;
      }

      const payload = {
        ...bookingInsertFromTour(user, tour),
        date: bookingDate,
      };
      const { error } = await supabase.from('bookings').insert(payload);
      if (error) {
        setBooking(false);
        setBookError(error.message || 'Booking failed');
        return;
      }

      if ((count ?? 0) + 1 >= capacity) {
        const nextSettings = {
          ...settings,
          availability: {
            ...settings.availability,
            unavailable_dates: Array.from(
              new Set([
                ...(settings.availability.unavailable_dates || []),
                bookingDate,
              ])
            ),
          },
        };
        // best-effort; ignore error
        await supabase
          .from('users')
          .update({
            badges: JSON.stringify(
              buildBadgesWithSettings(providerRow?.badges, nextSettings)
            ),
          })
          .eq('id', providerId);
      }

      setBooking(false);
      navigate('/app/bookings');
    } catch (err) {
      setBooking(false);
      setBookError(err?.message || 'Booking failed');
    }
  };

  return (
    <div className="tour-page" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Helmet>
        <title>{tour.name} — TourBid</title>
        <meta
          name="description"
          content={
            description ||
            `${tour.region} · ${tour.duration}${
              isAskForPrice ? '' : ` · ₾${tour.price}`
            }`
          }
        />
        <meta property="og:title" content={tour.name} />
      </Helmet>
      <Link to={backPath} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, display: 'inline-block' }}>
        ← {backLabel}
      </Link>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div style={{ aspectRatio: '21/9', background: 'var(--bg-elevated)' }}>
          {mainPhoto ? (
            <img src={mainPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 0, background: 'var(--s2, #1a1a2e)' }} />
          ) : (
            <span style={{ fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              {tour.emoji || '🗺️'}
            </span>
          )}
        </div>
        {tour.photos?.length > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
            {tour.photos.map((p, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                style={{
                  width: 56,
                  height: 40,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: photoIndex === i ? '2px solid var(--gold)' : '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  padding: 0,
                }}
              >
                <img src={photoUrl(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, background: 'var(--s2, #1a1a2e)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <span
        style={{
          background: 'var(--gold-soft)',
          color: 'var(--gold)',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: '0.8rem',
          fontWeight: 600,
        }}
      >
        {tour.type === 'van' ? '🚐 Van' : tour.type === 'guide' ? '🗺️ Guide' : '✈️ Transfer'}
      </span>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.9rem', marginTop: 12, marginBottom: 8 }}>
        {tour.name}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        {tour.region} · {tour.duration} · ⭐ {tour.rating || '—'} ({tour.reviews || 0} reviews)
      </p>
      {availabilityStatus && (
        <p
          style={{
            marginTop: -8,
            marginBottom: 16,
            fontSize: '0.9rem',
            color: availabilityStatus.available ? 'var(--green, #4CAF50)' : 'var(--red, #f44336)',
          }}
        >
          {availabilityStatus.available ? '● Available' : `○ ${availabilityStatus.text}`}
        </p>
      )}
      <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.8rem', color: 'var(--gold)', marginBottom: 16 }}>
        {isAskForPrice ? (
          <span style={{ fontStyle: 'italic', color: 'var(--cyan, #22d3ee)', fontSize: '1rem' }}>
            Ask for price
          </span>
        ) : (
          <>₾{tour.price}</>
        )}
      </p>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          Choose date
        </label>
        <input
          type="date"
          value={bookingDate}
          onChange={(e) => {
            const v = e.target.value;
            setBookingDate(v);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
          }}
        />
      </div>
      <p style={{ color: 'var(--text)', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>

      {(tour.providerId ?? tour.provider_id) && (
        <p style={{ marginBottom: 16 }}>
          <Link to={`/provider/${tour.providerId ?? tour.provider_id}`} style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>
            View guide profile →
          </Link>
        </p>
      )}

      {/* Book in app: only for tourists (in app) or when not logged in (landing/discover) */}
      {user ? (
        user.role === 'tourist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="tour-page-book-btn"
              onClick={handleBook}
              disabled={booking}
              style={{
                display: 'inline-block',
                background: 'var(--gold)',
                color: 'var(--bg)',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: booking ? 'wait' : 'pointer',
              }}
            >
              {booking ? 'Booking…' : t('tour.bookInApp')}
            </button>
            {bookError && <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{bookError}</p>}
          </div>
        )
      ) : (
        <Link
          to="/login"
          className="tour-page-book-btn"
          style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: 'var(--bg)',
            padding: '14px 28px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          {t('tour.bookInApp')}
        </Link>
      )}

      {reviews.length > 0 && (
        <section style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem', marginBottom: 16 }}>{t('tour.reviews')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {reviews.map((r, i) => (
              <li
                key={i}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <span style={{ color: 'var(--gold)' }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</span>
                {r.text && <p style={{ margin: '8px 0 0', color: 'var(--text)', fontSize: '0.95rem' }}>{r.text}</p>}
                <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.tourist_name} · {r.date || new Date(r.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!loading && reviews.length === 0 && (tour.providerId ?? tour.provider_id) && (
        <section style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem', marginBottom: 8 }}>{t('tour.reviews')}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t('tour.noReviews')}</p>
        </section>
      )}
    </div>
  );
}
