import { useState } from 'react';
import { auth } from 'firebase/app';

export const useAuthState = (auth: auth.Auth) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<firebase.auth.Error | null>(null);

  const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
      setIsAuthenticated(true);
    }

    setRefreshing(false);
  }, error => {
    setError(error);
  });

  return {
    isAuthenticated,
    unsubscribe,
    refreshing,
    error
  };
};
