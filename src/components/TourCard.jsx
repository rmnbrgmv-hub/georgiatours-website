import { Link } from 'react-router-dom';

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
export default function TourCard({ tour, linkTo, actions }) {
  const photo = getTourPhoto(tour);
  const content = (
    <>
      <div style={{ aspectRatio: '16/10', background: 'var(--s2, var(--bg-elevated))', borderRadius: 12, overflow: 'hidden' }}>
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
          <span style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {tour.emoji || '🗺️'}
          </span>
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
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', marginTop: 10, marginBottom: 6 }}>
          {tour.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: actions ? 12 : 0 }}>
          {tour.region} · {tour.duration} · ⭐ {tour.rating || '—'}
        </p>
        <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.35rem', color: 'var(--gold)' }}>₾{tour.price}</p>
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
