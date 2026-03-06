// lib/auth.ts — Authentication service wrappers
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GithubAuthProvider,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, mergeUserProfile } from './user';

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

function friendlyError(code: string): string {
    const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Try again.',
        'auth/invalid-credential': 'Invalid email or password. Try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/account-exists-with-different-credential':
            'An account already exists with this email under a different sign-in method.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
    };
    return messages[code] ?? 'Something went wrong. Please try again.';
}

export async function signUpWithEmail(
    email: string,
    password: string,
    displayName: string
): Promise<{ user: any | null; error: string | null }> {
    try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;
        await updateProfile(user, { displayName });
        await createUserProfile(user.uid, {
            displayName,
            email: user.email!,
            avatarUrl: null,
            provider: 'email',
        });
        return { user, error: null };
    } catch (err: any) {
        return { user: null, error: friendlyError(err.code) };
    }
}

export async function signInWithEmail(
    email: string,
    password: string
): Promise<{ user: any | null; error: string | null }> {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return { user: credential.user, error: null };
    } catch (err: any) {
        return { user: null, error: friendlyError(err.code) };
    }
}

export async function signInWithGitHub(): Promise<{
    user: any | null;
    isNew: boolean;
    error: string | null;
}> {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        const user = result.user;
        const isNew = (result as any)._tokenResponse?.isNewUser ?? false;
        const avatarUrl = user.photoURL ?? null;
        if (isNew) {
            await createUserProfile(user.uid, {
                displayName: user.displayName ?? 'GitHub User',
                email: user.email!,
                avatarUrl,
                provider: 'github',
            });
        } else {
            await mergeUserProfile(user.uid, { displayName: user.displayName ?? undefined, avatarUrl: avatarUrl ?? undefined });
        }
        return { user, isNew, error: null };
    } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user') {
            return { user: null, isNew: false, error: null };
        }
        return { user: null, isNew: false, error: friendlyError(err.code) };
    }
}

export async function signInWithGoogle(): Promise<{
    user: any | null;
    isNew: boolean;
    error: string | null;
}> {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const isNew = (result as any)._tokenResponse?.isNewUser ?? false;
        const avatarUrl = user.photoURL ?? null;
        if (isNew) {
            await createUserProfile(user.uid, {
                displayName: user.displayName ?? 'Google User',
                email: user.email!,
                avatarUrl,
                provider: 'google',
            });
        } else {
            await mergeUserProfile(user.uid, { displayName: user.displayName ?? undefined, avatarUrl: avatarUrl ?? undefined });
        }
        return { user, isNew, error: null };
    } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user') {
            return { user: null, isNew: false, error: null };
        }
        return { user: null, isNew: false, error: friendlyError(err.code) };
    }
}

export async function resetPassword(
    email: string
): Promise<{ sent: boolean; error: string | null }> {
    try {
        await sendPasswordResetEmail(auth, email);
        return { sent: true, error: null };
    } catch (err: any) {
        return { sent: false, error: friendlyError(err.code) };
    }
}

export async function logOut(): Promise<{ error: string | null }> {
    try {
        await signOut(auth);
        return { error: null };
    } catch (err: any) {
        return { error: friendlyError(err.code) };
    }
}
