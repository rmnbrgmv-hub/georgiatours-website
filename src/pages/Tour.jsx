import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Tour({ user }) {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('suspended', false)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          let photos = [];
          try {
            if (data.photos) photos = typeof data.photos === 'string' ? JSON.parse(data.photos) : data.photos;
          } catch (_) {}
          setTour({
            ...data,
            photos: Array.isArray(photos) ? photos : [],
          });
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (!tour) return <div style={{ padding: 80, textAlign: 'center' }}>Tour not found. <Link to="/explore">Back to Explore</Link></div>;

  const mainPhoto = tour.photos?.[photoIndex]?.base64 || tour.photos?.[photoIndex];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link to="/explore" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, display: 'inline-block' }}>
        ← Back to Explore
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
            <img src={mainPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <img src={p.base64 || p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.8rem', color: 'var(--gold)', marginBottom: 24 }}>
        ₾{tour.price}
      </p>
      <p style={{ color: 'var(--text)', lineHeight: 1.7, marginBottom: 24 }}>{tour.description || tour.desc}</p>

      {user ? (
        <a
          href={`https://your-app-url.com/explore?tour=${id}`}
          target="_blank"
          rel="noopener noreferrer"
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
          Book in app →
        </a>
      ) : (
        <Link
          to="/login"
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
          Sign in to book
        </Link>
      )}
    </div>
  );
}
