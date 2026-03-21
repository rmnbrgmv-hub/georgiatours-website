import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tourbid-favorites';
const FavoritesContext = createContext({ favorites: [], toggle: () => {}, isFav: () => false });

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggle = useCallback((tourId) => {
    setFavorites((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId]
    );
  }, []);

  const isFav = useCallback((tourId) => favorites.includes(tourId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFav }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
