import { useState } from 'react';
import { firestore } from 'firebase/app';

export const useDocumentDelete = <
  T extends { id: string }
>(
  firestore: firestore.Firestore,
  collectionPath: string
) => {
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const _delete = async (id: string) => {
    try {
      await firestore
        .collection(collectionPath)
        .doc(id)
        .delete();
      setDeleted(true);
    } catch (e) {
      setError(e);
      setDeleted(false);
      throw e;
    }
  };

  return {
    deleted,
    error,
    delete: _delete,
  };
};
