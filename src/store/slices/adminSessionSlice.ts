import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AdminSession } from '@/types';

/**
 * Persists the admin's game_code and admin_code for the current session.
 *
 * The admin_code is stored in both Redux and localStorage so that
 * refreshing the page doesn't lose access to the game.
 *
 * ⚠️  The admin_code is sensitive — it grants full control over the game.
 *     It's stored in localStorage only because it's a short-lived game secret
 *     and there's no server-side session for admins.
 */

const STORAGE_KEY = 'feud_admin_session';

// Rehydrate from localStorage on startup
function loadFromStorage(): AdminSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminSession;
  } catch {
    // Ignore parse errors
  }
  return { gameCode: null, adminCode: null, gameId: null };
}

function saveToStorage(session: AdminSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

const initialState: AdminSession = loadFromStorage();

export const adminSessionSlice = createSlice({
  name: 'adminSession',
  initialState,

  reducers: {
    // Called after a successful game creation — saves the one-time admin_code
    setAdminSession(
      _state,
      action: PayloadAction<{ gameCode: string; adminCode: string; gameId: string }>,
    ) {
      const next = action.payload;
      saveToStorage(next);
      return next;
    },

    // Called when the admin navigates away or starts a new game
    clearAdminSession() {
      localStorage.removeItem(STORAGE_KEY);
      return { gameCode: null, adminCode: null, gameId: null };
    },
  },
});

export const { setAdminSession, clearAdminSession } = adminSessionSlice.actions;
export default adminSessionSlice.reducer;
