import { useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import type { RootState } from '@/store';
import type { AdminSession } from '@/types';

const STORAGE_KEY = 'feud_admin_session';

function loadAdminSessionFromStorage(): AdminSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Protects admin routes.
 *
 * Requirements to access /admin/game/:gameCode (and /live sub-route):
 *   1. adminSession.adminCode is present
 *   2. adminSession.gameCode matches the :gameCode URL param
 *
 * The session is persisted in localStorage and rehydrated on startup,
 * so refreshing the page still works.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { gameCode } = useParams<{ gameCode: string }>();
  const session = useSelector((s: RootState) => s.adminSession);
  const storedSession = loadAdminSessionFromStorage();

  const effectiveSession =
    session.adminCode && session.gameCode ? session : storedSession;

  const isAuthorized =
    effectiveSession?.adminCode != null &&
    effectiveSession?.gameCode != null &&
    effectiveSession.gameCode === gameCode;

  if (!isAuthorized) {
    return <Navigate to="/admin/create" replace />;
  }

  return <>{children}</>;
}
