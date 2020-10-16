import { useState } from 'react';
import { firestore } from 'firebase/app';

export const useCollectionGet = <
  T extends { id: string; createTime: firestore.Timestamp }
>(
  firestore: firestore.Firestore,
  query: (firestore: firestore.Firestore) => firestore.Query,
  limit: number = 10
) => {
  const [items, setItems] = useState<T[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const snapshot = await query(firestore)
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      const _items = snapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as T;
      });
      setItems(_items);
      setRefreshing(false);
      setHasMore(_items.length > 0);
    } catch (e) {
      setError(e);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (refreshing || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const snapshot = await query(firestore)
        .orderBy('createTime', 'desc')
        .startAfter(items[items.length - 1].createTime)
        .limit(limit)
        .get();
      const _items = snapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as T;
      });
      setItems(items.concat(_items));
      setLoadingMore(false);
      setHasMore(_items.length > 0);
    } catch (e) {
      setError(e);
      setLoadingMore(false);
    }
  };

  return {
    items,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
  };
};
