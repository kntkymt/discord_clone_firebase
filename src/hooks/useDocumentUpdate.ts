import { useState } from 'react';
import firebase, { firestore } from 'firebase/app';

export const useDocumentUpdate = <
  T extends { id: string; updateTime: firestore.Timestamp }
>(
  firestore: firestore.Firestore,
  collectionPath: string
) => {
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = async (item: T) => {
    if (loading) return;
    setLoading(true);
    try {
      const id = item.id;
      delete item.id;
      item.updateTime = firebase.firestore.Timestamp.now();
      await firestore
        .collection(collectionPath)
        .doc(id)
        .set(item, { merge: true });
      setUpdated(true);
      setLoading(false);
    } catch (e) {
      setError(e);
      setUpdated(false);
      setLoading(false);
    }
  };

  return {
    updated,
    loading,
    error,
    update,
  };
};
