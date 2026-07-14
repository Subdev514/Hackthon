// lib/chat.ts — Real-time chat service
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const TYPING_TIMEOUT_MS = 4000;
const MESSAGE_PAGE_SIZE = 50;

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    createdAt: Date;
}

export async function sendMessage(opts: {
    roomId: string;
    channelId: string;
    text: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
}): Promise<{ messageId: string | null; error: string | null }> {
    const trimmed = opts.text.trim();
    if (!trimmed) return { messageId: null, error: 'Message cannot be empty.' };
    try {
        const messagesRef = collection(db, 'rooms', opts.roomId, 'channels', opts.channelId, 'messages');
        const docRef = await addDoc(messagesRef, {
            text: trimmed,
            senderId: opts.senderId,
            senderName: opts.senderName,
            senderAvatar: opts.senderAvatar ?? null,
            createdAt: serverTimestamp(),
        });
        await clearTyping({ roomId: opts.roomId, uid: opts.senderId });
        return { messageId: docRef.id, error: null };
    } catch (err: any) {
        console.error('[chat] sendMessage:', err);
        return { messageId: null, error: err.message };
    }
}

export function subscribeToMessages(
    roomId: string,
    channelId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const messagesRef = collection(db, 'rooms', roomId, 'channels', channelId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(MESSAGE_PAGE_SIZE));
    return onSnapshot(q, snap => {
        const messages: ChatMessage[] = snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as Omit<ChatMessage, 'id' | 'createdAt'>),
            createdAt: d.data().createdAt?.toDate() ?? new Date(),
        }));
        callback(messages);
    });
}

export async function setTyping(opts: {
    roomId: string;
    uid: string;
    displayName: string;
}): Promise<void> {
    try {
        await setDoc(doc(db, 'rooms', opts.roomId, 'typing', opts.uid), {
            displayName: opts.displayName,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[chat] setTyping:', err);
    }
}

export async function clearTyping(opts: {
    roomId: string;
    uid: string;
}): Promise<void> {
    try {
        await deleteDoc(doc(db, 'rooms', opts.roomId, 'typing', opts.uid));
    } catch (_) { }
}

export function subscribeToTyping(
    roomId: string,
    currentUid: string,
    callback: (typers: string[]) => void
): () => void {
    const typingRef = collection(db, 'rooms', roomId, 'typing');
    return onSnapshot(typingRef, snap => {
        const now = Date.now();
        const typers = snap.docs
            .filter(d => {
                if (d.id === currentUid) return false;
                const updatedAt = d.data().updatedAt?.toMillis();
                return updatedAt && now - updatedAt < TYPING_TIMEOUT_MS;
            })
            .map(d => d.data().displayName as string);
        callback(typers);
    });
}
