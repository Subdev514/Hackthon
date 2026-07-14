// context/AuthContext.tsx — Global auth state using Firebase onAuthStateChanged
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, UserProfile } from '../lib/user';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthState>({
    user: null,
    profile: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (!authUser) {
                setState({ user: null, profile: null, loading: false });
                return;
            }
            // Fetch Firestore profile alongside auth user
            const { profile } = await getUserProfile(authUser.uid);
            setState({ user: authUser, profile, loading: false });
        });
        return unsubscribe;
    }, []);

    return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    return useContext(AuthContext);
}
