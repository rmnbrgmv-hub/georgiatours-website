import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { mapServiceRow } from '../hooks/useAppData';
import { useFavorites } from '../context/FavoritesContext';
import TourCard from '../components/TourCard';
import { SkeletonGrid } from '../components/Skeleton';

export default function Favorites() {
  const { favorites } = useFavorites();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!favorites.length) {
      setTours([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('services')
      .select('*')
      .in('id', favorites)
      .then(({ data }) => {
        setTours((data || []).filter((s) => !s.suspended).map(mapServiceRow));
        setLoading(false);
      });
  }, [favorites]);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', marginBottom: 8 }}>
        ♥ My Wishlist
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 32 }}>
        {favorites.length} {favorites.length === 1 ? 'tour' : 'tours'} saved
      </p>

      {loading ? (
        <SkeletonGrid count={3} />
      ) : tours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>♡</div>
          <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No saved tours yet</p>
          <p style={{ fontSize: '0.9rem' }}>Tap the heart on any tour to save it here</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} linkTo={`/app/tour/${tour.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
