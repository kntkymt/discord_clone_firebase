import { useState } from 'react';
import { firestore } from 'firebase';

const useDocumentArrayUpdate = (documentRef: firestore.DocumentReference, key: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const add = async <T>(addValue: T) => {
    if (loading) return;
    setLoading(true);

    try {
      await documentRef.update({[key]: firestore.FieldValue.arrayUnion(addValue)});
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  const remove = async <T>(removeValue: T) => {
    if (loading) return;
    setLoading(true);

    try {
      await documentRef.update({[key]: firestore.FieldValue.arrayRemove(removeValue)});
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  return {
    add,
    remove,
    loading,
    error
  };
};

export default useDocumentArrayUpdate;
