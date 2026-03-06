// lib/rooms.ts — Room service for Firestore
import {
    doc,
    collection,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Channel {
    id: string;
    name: string;
}

export interface Room {
    roomId: string;
    name: string;
    channels: Channel[];
    createdBy: string;
    createdAt?: any;
}

function generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = (n: number) =>
        Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${seg(3)}-${seg(3)}`;
}

export async function createRoom(opts: {
    roomName: string;
    channels: string[];
    createdBy: string;
    displayName: string;
}): Promise<{ roomId: string | null; error: string | null }> {
    const { roomName, channels, createdBy, displayName } = opts;
    try {
        const channelList: Channel[] = channels.map((name, i) => ({
            id: `ch_${Date.now()}_${i}`,
            name: name.trim(),
        }));

        let roomId = generateRoomId();
        let exists = await getDoc(doc(db, 'rooms', roomId));
        if (exists.exists()) roomId = generateRoomId();

        await setDoc(doc(db, 'rooms', roomId), {
            roomId,
            name: roomName.trim(),
            channels: channelList,
            createdBy,
            createdAt: serverTimestamp(),
        });

        for (const ch of channelList) {
            await setDoc(doc(db, 'rooms', roomId, 'channels', ch.id), {
                name: ch.name,
                content: '',
                updatedBy: createdBy,
                updatedAt: serverTimestamp(),
            });
        }

        await setDoc(doc(db, 'rooms', roomId, 'members', createdBy), {
            displayName,
            joinedAt: serverTimestamp(),
        });

        return { roomId, error: null };
    } catch (err: any) {
        console.error('[rooms] createRoom:', err);
        return { roomId: null, error: err.message };
    }
}

export async function joinRoom(opts: {
    roomId: string;
    uid: string;
    displayName: string;
}): Promise<{ room: Room | null; error: string | null }> {
    const { roomId, uid, displayName } = opts;
    try {
        const roomRef = doc(db, 'rooms', roomId.trim().toUpperCase());
        const snap = await getDoc(roomRef);
        if (!snap.exists()) {
            return { room: null, error: 'Room not found. Check the room ID and try again.' };
        }
        await setDoc(doc(db, 'rooms', roomId, 'members', uid), {
            displayName,
            joinedAt: serverTimestamp(),
        });
        return { room: snap.data() as Room, error: null };
    } catch (err: any) {
        console.error('[rooms] joinRoom:', err);
        return { room: null, error: err.message };
    }
}

export async function getRoom(
    roomId: string
): Promise<{ room: Room | null; error: string | null }> {
    try {
        const snap = await getDoc(doc(db, 'rooms', roomId));
        if (!snap.exists()) return { room: null, error: 'Room not found.' };
        return { room: snap.data() as Room, error: null };
    } catch (err: any) {
        return { room: null, error: err.message };
    }
}

export async function getAllRooms(): Promise<Room[]> {
    try {
        const snap = await getDocs(collection(db, 'rooms'));
        return snap.docs.map(d => d.data() as Room);
    } catch {
        return [];
    }
}

export async function leaveRoom(opts: {
    roomId: string;
    uid: string;
}): Promise<{ error: string | null }> {
    try {
        await deleteDoc(doc(db, 'rooms', opts.roomId, 'members', opts.uid));
        return { error: null };
    } catch (err: any) {
        return { error: err.message };
    }
}

export function subscribeToMembers(
    roomId: string,
    callback: (members: Array<{ uid: string; displayName: string }>) => void
): () => void {
    const ref = collection(db, 'rooms', roomId, 'members');
    return onSnapshot(ref, snap => {
        const members = snap.docs.map(d => ({ uid: d.id, ...d.data() } as { uid: string; displayName: string }));
        callback(members);
    });
}

export async function updateChannelContent(opts: {
    roomId: string;
    channelId: string;
    content: string;
    uid: string;
}): Promise<{ error: string | null }> {
    try {
        await updateDoc(doc(db, 'rooms', opts.roomId, 'channels', opts.channelId), {
            content: opts.content,
            updatedBy: opts.uid,
            updatedAt: serverTimestamp(),
        });
        return { error: null };
    } catch (err: any) {
        return { error: err.message };
    }
}

export function subscribeToChannel(
    roomId: string,
    channelId: string,
    callback: (data: { content: string; updatedBy: string }) => void
): () => void {
    const ref = doc(db, 'rooms', roomId, 'channels', channelId);
    return onSnapshot(ref, snap => {
        if (snap.exists()) {
            callback({ content: snap.data().content, updatedBy: snap.data().updatedBy });
        }
    });
}
