import { useState, useEffect, useCallback } from 'react';
import { firestore } from 'firebase/app';

export const useDocumentCollectionCombine = <
  T extends { id: string },
  U extends { id: string; createTime: firestore.Timestamp }
>(
  firestore: firestore.Firestore,
  reference: (firestore: firestore.Firestore) => firestore.DocumentReference,
  query: (firestore: firestore.Firestore, item: T) => firestore.Query,
  limit: number = 10
) => {
  const [item, setItem] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [documentError, setDocumentError] = useState<Error | null>(null);

  const [items, setItems] = useState<U[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [collectionError, setCollectionError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (refreshing || item === undefined) return;
    setRefreshing(true);
    try {
      const snapshot = await query(firestore, item!)
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      const _items = snapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as U;
      });
      setItems(_items);
      setRefreshing(false);
      setHasMore(_items.length > 0);
    } catch (e) {
      setCollectionError(e);
      setRefreshing(false);
    }
  }, [firestore, item, limit, query, refreshing]);

  useEffect(() => {
    if (item !== undefined) {
      refresh();
    }
  }, [item, refresh]);

  const load = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const doc = await reference(firestore).get();
      if (doc.exists) {
        const item = { ...doc.data(), id: doc.id } as T;
        setItem(item);
      }
      setLoading(false);
    } catch (e) {
      setDocumentError(e);
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (refreshing || loadingMore || !hasMore || item === undefined) return;
    setLoadingMore(true);
    try {
      const snapshot = await query(firestore, item!)
        .orderBy('createTime', 'desc')
        .startAfter(items[items.length - 1].createTime)
        .limit(limit)
        .get();
      const _items = snapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as U;
      });
      setItems(items.concat(_items));
      setLoadingMore(false);
      setHasMore(_items.length > 0);
    } catch (e) {
      setCollectionError(e);
      setLoadingMore(false);
    }
  };

  return {
    document: {
      item,
      loading,
      error: documentError,
      load,
    },
    collection: {
      items,
      refreshing,
      loadingMore,
      hasMore,
      error: collectionError,
      refresh,
      loadMore,
    },
  };
};
