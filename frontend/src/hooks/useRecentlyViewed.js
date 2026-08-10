import { useState, useEffect } from 'react';

const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 10;

const useRecentlyViewed = () => {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  const addRecentlyViewed = (productId) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, MAX_ITEMS);
    });
  };

  return { recentlyViewedIds, addRecentlyViewed };
};

export default useRecentlyViewed;
