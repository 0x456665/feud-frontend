import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Tv2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetBoardQuery, useGetPlayerCountQuery } from '@/store/api/playerApi';
import { applyBoardSnapshot } from '@/store/slices/gameStateSlice';
import { useGameEvents } from '@/hooks/useGameEvents';
import type { RootState, AppDispatch } from '@/store';

/**
 * Player: Game gateway page  (/game/:gameCode).
 *
 * This is the main player page after joining. It:
 *   1. Opens the SSE stream
 *   2. Loads the board snapshot
 *   3. Routes the player to the appropriate view based on game state:
 *      - LOBBY / voting OPEN → show "waiting for survey" + link to vote
 *      - IN_PROGRESS         → show the live game board inline
 *      - FINISHED            → redirect to /game/:gameCode/end
 */
export default function PlayerGame() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { playState, votingState } = useSelector((s: RootState) => s.gameState);

  // ── Board snapshot ────────────────────────────────────────────────────
  const { data: board, isLoading: boardLoading, refetch: refetchBoard } = useGetBoardQuery(gameCode);
  const { data: playerCount } = useGetPlayerCountQuery(gameCode, {
    pollingInterval: 10_000,
  });

  // Apply board snapshot to Redux on initial load
  useEffect(() => {
    if (board) dispatch(applyBoardSnapshot(board));
  }, [board, dispatch]);

  // ── SSE reconnect ─────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async () => {
    try {
      const freshBoard = await refetchBoard().unwrap();
      dispatch(applyBoardSnapshot(freshBoard));
    } catch {
      // Will retry on next event
    }
  }, [refetchBoard, dispatch]);

  // ── SSE events ────────────────────────────────────────────────────────
  useGameEvents(gameCode, handleDisconnect);

  // ── Navigation based on game state ────────────────────────────────────
  useEffect(() => {
    if (playState === 'FINISHED') {
      navigate(`/game/${gameCode}/end`);
    } else if (playState === 'IN_PROGRESS') {
      navigate(`/game/${gameCode}/board`);
    } else if (votingState === 'OPEN') {
      navigate(`/game/${gameCode}/vote`);
    }
  }, [playState, votingState, gameCode, navigate]);

  if (boardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Lobby/waiting view ────────────────────────────────────────────────
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Logo */}
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
        <Tv2 className="size-8 text-primary-foreground" />
      </div>

      <div>
        <Badge variant="secondary" className="mb-2">
          {votingState === 'OPEN' ? 'Survey Open' : 'Waiting for game…'}
        </Badge>
        <h1 className="text-3xl font-extrabold">You're in!</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Game code: <span className="font-mono font-bold text-primary">{gameCode}</span>
        </p>
      </div>

      {/* Player count */}
      {playerCount && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>
            <strong className="text-foreground">{playerCount.count}</strong> player
            {playerCount.count !== 1 ? 's' : ''} in the lobby
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        {votingState === 'OPEN' && (
          <Button
            className="w-full gap-2"
            onClick={() => navigate(`/game/${gameCode}/vote`)}
          >
            Vote on Survey Questions
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/game/${gameCode}/board`)}
        >
          Watch Live Board
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        The game will start automatically when the host is ready.
      </p>
    </div>
  );
}
