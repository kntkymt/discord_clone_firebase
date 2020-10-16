import { useState } from 'react';
import { firestore } from 'firebase/app';

export const useDocumentGet = <T extends { id: string }>(
  firestore: firestore.Firestore,
  collectionPath: string
) => {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const doc = await firestore.collection(collectionPath).doc(id).get();
      if (doc.exists) {
        const item = { ...doc.data(), id: doc.id } as T;
        setItem(item);
      }
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
