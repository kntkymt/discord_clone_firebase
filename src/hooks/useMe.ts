import { useEffect } from 'react';
import Firebase from '../application/Firebase';
import { useDocumentGet } from './useDocumentGet';
import { User } from '../model/User';

export const useMe = () => {
  const firestore = Firebase.firestore();
  const { item, loading, error, load } = useDocumentGet<User>(firestore, "versions/1/users");

  useEffect(() => {
    const id = Firebase.auth()?.currentUser?.uid;
    if (id) {
      load(id);
    }
  }, [Firebase.auth()?.currentUser?.uid]);

  return {
    item,
    loading,
    error
  };
};
