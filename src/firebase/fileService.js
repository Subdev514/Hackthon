// fileService.js — Project Folder Upload, Retrieval & Live Editing
// ─────────────────────────────────────────────────────────────────
// Stores file contents as text directly in Firestore — no Firebase Storage needed.
//
// Firestore structure:
//   rooms/{roomId}/files/{fileId}          — original uploaded file
//     name, path, content, size, language, uploadedBy, uploadedAt
//
//   rooms/{roomId}/fileContents/{fileId}   — live edited version
//     content, editedBy, updatedAt

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const IGNORED_NAMES = new Set([
  ".DS_Store", "Thumbs.db", ".env", ".env.local", ".env.production",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
]);

const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".svn", "dist", "build", ".next", ".nuxt",
  ".cache", "coverage", ".turbo",
]);

// Max 500 KB per file (Firestore doc limit is 1 MB)
const MAX_FILE_BYTES = 500 * 1024;

const EXT_TO_LANGUAGE = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", rb: "ruby", java: "java", cpp: "cpp", c: "c", cs: "csharp",
  go: "go", rs: "rust", php: "php", swift: "swift", kt: "kotlin",
  html: "html", css: "css", scss: "scss", less: "less",
  json: "json", md: "markdown", yml: "yaml", yaml: "yaml",
  sh: "bash", bash: "bash", sql: "sql", xml: "xml",
  vue: "vue", svelte: "svelte",
};

function inferLanguage(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANGUAGE[ext] ?? "plaintext";
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD FOLDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Read a collection of File objects, filter them, read their text content,
 * and store each as a Firestore document under rooms/{roomId}/files.
 *
 * @param {{
 *   roomId:      string,
 *   uid:         string,
 *   files:       FileList | File[],
 *   onProgress?: (uploaded: number, total: number, currentFile: string) => void,
 *   onError?:    (file: File, reason: string) => void,
 * }} opts
 * @returns {{ uploaded: number, skipped: number, error: string | null }}
 */
export async function uploadFolder({ roomId, uid, files, onProgress, onError }) {
  const fileArray = Array.from(files);

  const allowed = fileArray.filter((file) => {
    const parts = (file.webkitRelativePath || file.name).split("/");
    const name  = parts.at(-1);
    const dirs  = parts.slice(0, -1);
    if (IGNORED_NAMES.has(name))             return false;
    if (name.startsWith("."))                return false;
    if (dirs.some(d => IGNORED_DIRS.has(d))) return false;
    if (file.size > MAX_FILE_BYTES) {
      onError?.(file, "Skipped — exceeds 500 KB limit");
      return false;
    }
    return true;
  });

  if (!allowed.length) {
    return { uploaded: 0, skipped: fileArray.length, error: "No uploadable files found." };
  }

  let uploaded = 0;
  let skipped  = fileArray.length - allowed.length;

  for (const file of allowed) {
    const relativePath = file.webkitRelativePath || file.name;
    try {
      onProgress?.(uploaded, allowed.length, relativePath);
      const content = await readFileAsText(file);
      await addDoc(collection(db, "rooms", roomId, "files"), {
        name:       file.name,
        path:       relativePath,
        content,
        size:       file.size,
        language:   inferLanguage(file.name),
        uploadedBy: uid,
        uploadedAt: serverTimestamp(),
      });
      uploaded++;
    } catch (err) {
      console.error(`[fileService] Failed to upload ${relativePath}:`, err);
      onError?.(file, err.message);
      skipped++;
    }
  }

  return { uploaded, skipped, error: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET FILE LIST (one-shot)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all file metadata + content for a room once.
 *
 * @param {string} roomId
 * @returns {{ files: object[], error: string | null }}
 */
export async function getRoomFiles(roomId) {
  try {
    const q    = query(collection(db, "rooms", roomId, "files"), orderBy("path", "asc"));
    const snap = await getDocs(q);
    return { files: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (err) {
    return { files: [], error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBE TO FILE LIST (real-time)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to live updates of the room's file list.
 *
 * @param {string} roomId
 * @param {(files: object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToFiles(roomId, callback) {
  const q = query(collection(db, "rooms", roomId, "files"), orderBy("path", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE FILE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Delete a file document from Firestore.
 *
 * @param {string} roomId
 * @param {string} fileId
 * @returns {{ error: string | null }}
 */
export async function deleteFile(roomId, fileId) {
  try {
    await deleteDoc(doc(db, "rooms", roomId, "files", fileId));
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE FILE EDITING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Push a live edit to Firestore. Debounce this in the UI (300ms recommended).
 * Writes to fileContents/{fileId} — separate from the original upload.
 *
 * @param {{ roomId: string, fileId: string, content: string, uid: string }} opts
 * @returns {{ error: string | null }}
 */
export async function updateFileContent({ roomId, fileId, content, uid }) {
  try {
    await setDoc(doc(db, "rooms", roomId, "fileContents", fileId), {
      content,
      editedBy:  uid,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    console.error("[fileService] updateFileContent:", err);
    return { error: err.message };
  }
}

/**
 * Subscribe to live edits of a file.
 * Fires immediately — returns null if no edits exist yet (caller falls back
 * to the original uploaded content in that case).
 *
 * @param {string} roomId
 * @param {string} fileId
 * @param {(data: { content: string, editedBy: string } | null) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToFileContent(roomId, fileId, callback) {
  return onSnapshot(
    doc(db, "rooms", roomId, "fileContents", fileId),
    (snap) => {
      callback(snap.exists()
        ? { content: snap.data().content, editedBy: snap.data().editedBy }
        : null
      );
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file, "utf-8");
  });
}

export function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
