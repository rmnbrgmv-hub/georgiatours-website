import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';

/** Get main photo URL/base64 for a tour (main flagged first, fallback to index 0). */
export function getTourPhoto(tour) {
  const photos = Array.isArray(tour.photos) ? tour.photos : [];
  const main = photos.find((p) => p && p.isMain) || photos[0];
  return (main && (main.base64 || main.url || main)) || null;
}

function typeLabel(type) {
  return type === 'van' ? 'Van' : type === 'guide' ? 'Guide' : 'Transfer';
}

/**
 * Tour card matching the discover/explore design: image, type badge, name, region · duration · rating, price.
 * Optional linkTo (whole card links), optional actions (e.g. Edit button; use stopPropagation if inside link).
 */
export default function TourCard({ tour, linkTo, actions, providerAvailability }) {
  const { isFav, toggle } = useFavorites();
  const favorited = isFav(tour.id);
  const photo = getTourPhoto(tour);
  const tags = Array.isArray(tour.tags) ? tour.tags : [];
  const pricingType = tags.includes('per_person')
    ? 'per_person'
    : tags.includes('starting_from')
      ? 'starting_from'
      : tags.includes('ask')
        ? 'ask'
        : 'fixed';
  const isAskForPrice = pricingType === 'ask' || tour.price == null || Number(tour.price) <= 0;
  const content = (
    <>
      <div style={{ aspectRatio: '16/10', background: 'var(--s2, var(--bg-elevated))', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(tour.id); }}
          title={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
            color: favorited ? '#f43f5e' : '#fff',
            transition: 'transform 0.15s',
          }}
        >
          {favorited ? '♥' : '♡'}
        </button>
        {photo ? (
          <img
            src={photo}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: 12,
              background: 'var(--s2, #1a1a2e)',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 50%, #C9A84C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>{tour.type === 'transfer' || tour.type === 'van' ? '🚐' : '🏔️'}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, letterSpacing: 1, opacity: 0.9 }}>{tour.region || 'Georgia'}</div>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: 20 }}>
        <span
          style={{
            background: 'var(--gold-soft)',
            color: 'var(--gold)',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        >
          {typeLabel(tour.type)}
        </span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', marginTop: 10, marginBottom: 2 }}>
          {tour.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, flexWrap: 'wrap' }}>
          {tour.verified && <span style={{ color: '#4CAF50' }}>✓ Verified</span>}
          {tour.total_bookings > 0 && <span>{tour.total_bookings} bookings</span>}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 0 }}>
          {tour.region} · {tour.duration} · ⭐ {tour.rating || '—'}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {tour.description || tour.desc || `Explore the beauty of ${tour.region || 'Georgia'}`}
        </p>
        <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.35rem', color: 'var(--gold)' }}>
          {isAskForPrice ? (
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, background: 'var(--cyan, #1D9E75)', color: '#fff', border: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
              Ask for price
            </span>
          ) : (
            <>
              {pricingType === 'starting_from' ? 'From ' : ''}
              ₾{tour.price}
              {pricingType === 'per_person' ? ' / person' : ''}
            </>
          )}
        </p>
        {providerAvailability && (
          <p
            style={{
              fontSize: '0.8rem',
              marginTop: 6,
              marginBottom: 0,
              color: providerAvailability.ok ? 'var(--green, #4CAF50)' : 'var(--red, #f44336)',
            }}
          >
            {providerAvailability.ok ? '● ' : '○ '}
            {providerAvailability.text}
          </p>
        )}
        {actions && (
          <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </>
  );

  const cardStyle = {
    display: 'block',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    transition: 'var(--transition)',
  };

  if (linkTo) {
    return (
      <Link to={linkTo} style={cardStyle}>
        {content}
      </Link>
    );
  }
  return <div style={cardStyle}>{content}</div>;
}
