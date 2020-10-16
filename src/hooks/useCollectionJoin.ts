import { useState } from 'react';
import { firestore } from 'firebase/app';

export const useCollectionJoin = <
  T extends { id: string; }
>(
  firestore: firestore.Firestore,
  query: (firestore: firestore.Firestore) => firestore.Query,
  join: (firestore: firestore.Firestore, snapshot: firestore.DocumentSnapshot) => firestore.DocumentReference,
  limit: number = 10
) => {
  let keys: firestore.DocumentSnapshot[] = [];

  const [items, setItems] = useState<T[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      keys = [];
      const snapshot = await query(firestore)
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      const _items = snapshot.docs.map(async (doc) => {
        keys.push(doc);
        const _doc = await join(firestore, doc).get();
        return { ..._doc.data(), id: _doc.id } as T;
      });
      const joins = await Promise.all(_items);
      setItems(joins);
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
        .startAfter(keys[keys.length - 1].data()!.createTime)
        .limit(limit)
        .get();
      const _items = snapshot.docs.map(async (doc) => {
        keys.push(doc);
        const _doc = await join(firestore, doc).get();
        return { ..._doc.data(), id: _doc.id } as T;
      });
      const joins = await Promise.all(_items);
      setItems(items.concat(joins));
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
