import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { mapServiceRow } from '../hooks/useAppData';
import { useFavorites } from '../context/FavoritesContext';
import TourCard from '../components/TourCard';
import { SkeletonGrid } from '../components/Skeleton';
import ViewControls, { loadViewPrefs, saveViewPref } from '../components/ViewControls';

export default function Favorites() {
  const { favorites } = useFavorites();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const fSavedViews = loadViewPrefs();
  const [viewMode, setViewMode] = useState(fSavedViews.favorites || 'grid');
  const [sortMode, setSortMode] = useState('new');

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
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
        {favorites.length} {favorites.length === 1 ? 'tour' : 'tours'} saved
      </p>
      <ViewControls view={viewMode} setView={(v) => { setViewMode(v); saveViewPref('favorites', v); }} sort={sortMode} setSort={setSortMode} />

      {loading ? (
        <SkeletonGrid count={3} />
      ) : tours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>♡</div>
          <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No saved tours yet</p>
          <p style={{ fontSize: '0.9rem' }}>Tap the heart on any tour to save it here</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: viewMode === 'compact' ? 12 : 24 }}>
          {[...tours].sort((a, b) => sortMode === 'new' ? (b.id - a.id) : (a.id - b.id)).map((tour) => (
            <TourCard key={tour.id} tour={tour} linkTo={`/app/tour/${tour.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
