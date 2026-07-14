import { auth } from './firebase';

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Wrapper for fetch that automatically attaches the user's Firebase ID token
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const user = auth.currentUser;
    let token = '';

    if (user) {
        try {
            token = await user.getIdToken();
        } catch (error) {
            console.error('[API] Error getting Firebase token:', error);
        }
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMsg = 'Network request failed';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

/**
 * Call the backend Gemini AI debug endpoint
 */
export async function askDebugAI(roomId: string, codeSnippet: string, errorMessage?: string) {
    return fetchWithAuth('/ai/debug', {
        method: 'POST',
        body: JSON.stringify({ roomId, codeSnippet, errorMessage }),
    });
}

/**
 * Fetch Analytics data from the backend SQLite db
 */
export async function getAnalyticsData() {
    return fetchWithAuth('/analytics', {
        method: 'GET',
    });
}
