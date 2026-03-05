// firestore.js
// Generic Firestore CRUD helpers

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.config";

// --- Create ---

// Add a document with an auto-generated ID
export const addDocument = (collectionName, data) =>
  addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

// Set a document with a specific ID (creates or overwrites)
export const setDocument = (collectionName, docId, data) =>
  setDoc(doc(db, collectionName, docId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

// --- Read ---

// Get a single document by ID
export const getDocument = async (collectionName, docId) => {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Get all documents in a collection
export const getCollection = async (collectionName) => {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Query documents
// Example: queryDocuments("posts", [where("authorId", "==", uid)], orderBy("createdAt", "desc"))
export const queryDocuments = async (collectionName, ...queryConstraints) => {
  const q = query(collection(db, collectionName), ...queryConstraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// --- Update ---

export const updateDocument = (collectionName, docId, data) =>
  updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });

// --- Delete ---

export const deleteDocument = (collectionName, docId) =>
  deleteDoc(doc(db, collectionName, docId));

// --- Real-time Listener ---
// Returns an unsubscribe function. Call it to stop listening.
// Example: const unsub = subscribeToCollection("messages", (docs) => setMessages(docs));
export const subscribeToCollection = (collectionName, callback, ...queryConstraints) => {
  const q = queryConstraints.length
    ? query(collection(db, collectionName), ...queryConstraints)
    : collection(db, collectionName);

  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
};

// Re-export Firestore query helpers so callers don't need to import firebase directly
export { where, orderBy, serverTimestamp };
