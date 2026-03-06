// lib/user.ts — Firestore User Profile Management
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

const USERS_COLLECTION = 'users';

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    provider: string;
    createdAt?: any;
    updatedAt?: any;
}

export async function createUserProfile(
    uid: string,
    data: { displayName: string; email: string; avatarUrl: string | null; provider: string }
): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const existing = await getDoc(userRef);
        if (existing.exists()) {
            return { profile: existing.data() as UserProfile, error: null };
        }
        const profile: UserProfile = {
            uid,
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, profile);
        return { profile, error: null };
    } catch (err: any) {
        console.error('[user] createUserProfile:', err);
        return { profile: null, error: err.message };
    }
}

export async function getUserProfile(
    uid: string
): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
        const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
        if (!snap.exists()) return { profile: null, error: 'User profile not found.' };
        return { profile: snap.data() as UserProfile, error: null };
    } catch (err: any) {
        console.error('[user] getUserProfile:', err);
        return { profile: null, error: err.message };
    }
}

export async function mergeUserProfile(
    uid: string,
    fields: Partial<{ displayName: string; avatarUrl: string }>
): Promise<{ error: string | null }> {
    try {
        await updateDoc(doc(db, USERS_COLLECTION, uid), {
            ...fields,
            updatedAt: serverTimestamp(),
        });
        return { error: null };
    } catch (err: any) {
        console.error('[user] mergeUserProfile:', err);
        return { error: err.message };
    }
}

export async function uploadAvatar(
    uid: string,
    file: File
): Promise<{ avatarUrl: string | null; error: string | null }> {
    try {
        if (!file.type.startsWith('image/')) {
            return { avatarUrl: null, error: 'Only image files are allowed.' };
        }
        if (file.size > 5 * 1024 * 1024) {
            return { avatarUrl: null, error: 'Avatar must be smaller than 5 MB.' };
        }
        const avatarRef = ref(storage, `avatars/${uid}/avatar`);
        await uploadBytes(avatarRef, file, { contentType: file.type });
        const avatarUrl = await getDownloadURL(avatarRef);
        const { error } = await mergeUserProfile(uid, { avatarUrl });
        if (error) throw new Error(error);
        return { avatarUrl, error: null };
    } catch (err: any) {
        console.error('[user] uploadAvatar:', err);
        return { avatarUrl: null, error: err.message };
    }
}

export async function deleteAvatar(uid: string): Promise<{ error: string | null }> {
    try {
        const avatarRef = ref(storage, `avatars/${uid}/avatar`);
        await deleteObject(avatarRef);
        return mergeUserProfile(uid, { avatarUrl: undefined });
    } catch (err: any) {
        if (err.code === 'storage/object-not-found') {
            return mergeUserProfile(uid, { avatarUrl: undefined });
        }
        console.error('[user] deleteAvatar:', err);
        return { error: err.message };
    }
}
