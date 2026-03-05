// useAuth.js
// React hook that exposes the current Firebase user and loading state.
// Works with React 16.8+ and any component tree.

import { useState, useEffect } from "react";
import { onAuthChange } from "./auth";

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe; // clean up listener on unmount
  }, []);

  return { user, loading };
}
