import { useState } from 'react';
import firebase, { firestore } from 'firebase/app';

export const useDocumentCreate = <
  T extends {
    id: string;
    createTime: firestore.Timestamp;
    updateTime: firestore.Timestamp;
  }
>(
  firestore: firestore.Firestore,
  collectionPath: string
) => {
  const [error, setError] = useState<Error | null>(null);

  const create = async (item: T) => {
    try {
      if (item.id === "") {
        delete item.id;
        await firestore.collection(collectionPath).add(item);
      } else {
        const id = item.id;
        delete item.id;
        await firestore.collection(collectionPath).doc(id).set(item);
      }
    } catch (e) {
      console.error(e);
      setError(e);
    }
  };

  return {
    error,
    create,
  };
};
