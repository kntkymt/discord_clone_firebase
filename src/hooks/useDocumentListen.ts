import { useState } from 'react';
import { firestore } from 'firebase/app';

export const useDocumentListen = <T extends { id: string }>(
  firestore: firestore.Firestore,
  reference: (firestore: firestore.Firestore) => firestore.DocumentReference
) => {
  const [item, setItem] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (loading) return;
    setLoading(true);
    try {
      reference(firestore).onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const item = { ...snapshot.data(), id: snapshot.id } as T;
          setItem(item);
        }
      });
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  return {
    item,
    loading,
    error,
    load,
  };
};
