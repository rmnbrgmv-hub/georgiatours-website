import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';

/** Get main photo URL/base64 for a tour (main flagged first, fallback to index 0). */
export function getTourPhoto(tour) {
  const photos = Array.isArray(tour.photos) ? tour.photos : [];
  const main = photos.find((p) => p && p.isMain) || photos[0];
  return (main && (main.base64 || main.url || main)) || null;
}

function typeIcon(type) {
  return type === 'guide' ? '🗺️ Guide' : type === 'van' ? '🚐 Van' : '✈️ Transfer';
}

/**
 * Tour card — GetYourGuide / Viator-style professional design.
 */
export default function TourCard({ tour, linkTo, actions, providerAvailability }) {
  const { isFav, toggle } = useFavorites();
  const favorited = isFav(tour.id);
  const photo = getTourPhoto(tour);
  const hasPhoto = !!photo;
  const tags = Array.isArray(tour.tags) ? tour.tags : [];
  const pricingType = tags.includes('per_person')
    ? 'per_person'
    : tags.includes('starting_from')
      ? 'starting_from'
      : tags.includes('ask')
        ? 'ask'
        : 'fixed';
  const isAskForPrice = pricingType === 'ask' || tour.price == null || Number(tour.price) <= 0;

  // "New" badge: created in last 7 days
  const isNew = tour.created_at && (Date.now() - new Date(tour.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  // "Popular" badge: rating >= 4.5 and > 5 reviews
  const isPopular = (Number(tour.rating) || 0) >= 4.5 && (Number(tour.reviews) || 0) > 5;

  const content = (
    <div
      style={{
        background: 'var(--bg-elevated, #fff)',
        borderRadius: 'var(--radius-md, 12px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        border: '1px solid var(--border-light, var(--border))',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Photo section */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/10',
        overflow: 'hidden',
        background: hasPhoto ? '#000' : 'linear-gradient(135deg, #0D9373, #065F46)',
      }}>
        {hasPhoto ? (
          <img src={photo} alt={tour.name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', color: '#fff', gap: 4,
          }}>
            <span style={{ fontSize: '2.5rem' }}>
              {tour.type === 'transfer' || tour.type === 'van' ? '🚐' : '🏔️'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8 }}>
              {tour.region || 'Georgia'}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        {hasPhoto && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
          }} />
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(tour.id); }}
          title={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s',
            color: favorited ? '#f43f5e' : '#94A3B8',
          }}
        >
          {favorited ? '❤️' : '🤍'}
        </button>

        {/* Category badge */}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          padding: '4px 10px', borderRadius: 6,
          background: 'rgba(255,255,255,0.9)',
          fontSize: '0.7rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.5px',
          color: '#1A1A2E',
        }}>
          {typeIcon(tour.type)}
        </span>

        {/* Popular / New badge */}
        {(isPopular || isNew) && (
          <span style={{
            position: 'absolute', bottom: 12, left: 12,
            padding: '4px 10px', borderRadius: 6,
            background: isPopular ? 'var(--cta, #E07A5F)' : 'var(--accent, #0D9373)',
            color: '#fff',
            fontSize: '0.7rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {isPopular ? 'Popular' : 'New'}
          </span>
        )}
      </div>

      {/* Content section */}
      <div style={{ padding: '14px 16px' }}>
        {/* Location + duration */}
        <div style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.5px', marginBottom: 4,
          fontFamily: 'var(--font-body)',
        }}>
          {tour.region || 'Georgia'}{tour.duration ? ' · ' + tour.duration : ''}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.05rem', fontWeight: 600,
          color: 'var(--text)', margin: '0 0 6px',
          lineHeight: 1.3,
          fontFamily: 'var(--font-body)',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {tour.name}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-muted)',
          margin: '0 0 10px', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {tour.description || tour.desc || `Explore the beauty of ${tour.region || 'Georgia'} with a local expert.`}
        </p>

        {/* Rating + reviews */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 10, fontSize: '0.85rem',
        }}>
          {(Number(tour.rating) || 0) > 0 ? (
            <>
              <span style={{ color: '#F59E0B', fontWeight: 600 }}>⭐ {tour.rating}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                ({tour.reviews || 0} reviews)
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>New tour</span>
          )}
          {tour.verified && (
            <span style={{ color: '#0D9373', fontSize: '0.75rem', fontWeight: 500 }}>✓ Verified</span>
          )}
        </div>

        {/* Provider info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 12, paddingBottom: 12,
          borderBottom: '1px solid var(--border-light, var(--border))',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent-light, var(--cyan-soft))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent, var(--cyan))',
          }}>
            {(tour.provider_name || tour.provider || 'G')[0]}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)' }}>
              {tour.provider_name || tour.provider || 'Local guide'}
            </div>
            {(tour.total_bookings || 0) > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {tour.total_bookings} bookings completed
              </div>
            )}
          </div>
        </div>

        {/* Price + trust signal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isAskForPrice ? (
            <span style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--accent, #0D9373)', color: '#fff',
              border: 'none', fontSize: '0.85rem', fontWeight: 600,
            }}>
              Ask for price
            </span>
          ) : (
            <div>
              {pricingType === 'starting_from' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</div>
              )}
              <span style={{
                fontSize: '1.25rem', fontWeight: 700,
                color: 'var(--text)',
              }}>
                ₾{tour.price}
              </span>
              {pricingType === 'per_person' && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/person</span>
              )}
            </div>
          )}
          <div style={{
            fontSize: '0.75rem', color: 'var(--accent, #0D9373)', fontWeight: 500,
          }}>
            ✓ Free cancellation
          </div>
        </div>

        {providerAvailability && (
          <p style={{
            fontSize: '0.8rem', marginTop: 8, marginBottom: 0,
            color: providerAvailability.ok ? 'var(--accent, #4CAF50)' : '#f44336',
          }}>
            {providerAvailability.ok ? '● ' : '○ '}
            {providerAvailability.text}
          </p>
        )}
        {Number.isFinite(Number(tour.lat)) && Number.isFinite(Number(tour.lng)) && (
          <p style={{ fontSize: '0.78rem', marginTop: 6, marginBottom: 0, color: 'var(--accent, #0D9373)', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 View on map
          </p>
        )}
        {actions && (
          <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }
  return content;
}
