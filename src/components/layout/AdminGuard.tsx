import { useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import type { RootState } from '@/store';

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

  const isAuthorized =
    session.adminCode != null &&
    session.gameCode != null &&
    session.gameCode === gameCode;

  if (!isAuthorized) {
    return <Navigate to="/admin/create" replace />;
  }

  return <>{children}</>;
}
