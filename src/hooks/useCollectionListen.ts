import { useState } from 'react';
import { firestore } from 'firebase/app';

export const useCollectionListen = <
  T extends { id: string; createTime: firestore.Timestamp }
>(
  firestore: firestore.Firestore,
  query: (firestore: firestore.Firestore) => firestore.Query
) => {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const subscribe = (): (() => void) => {
    return query(firestore)
      .orderBy('createTime', 'desc')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id } as T;
        });

        setItems(items);
      }, error => setError(error));
  };

  return {
    subscribe,
    items,
    error
  };
};
