import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2, Radio, Trophy, Tv2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { AnswerTile } from '@/components/game/AnswerTile';
import { StrikeMarks } from '@/components/game/StrikeMarks';
import { TeamScoreCard } from '@/components/game/TeamScoreCard';
import { useGameEvents } from '@/hooks/useGameEvents';
import { useGetBoardQuery } from '@/store/api/playerApi';
import { applyBoardSnapshot } from '@/store/slices/gameStateSlice';
import type { RootState, AppDispatch } from '@/store';

/**
 * Player: Game Board page.
 *
 * A read-only live view of the game board driven entirely by SSE events.
 * No controls — just the scoreboard, current question, and answer tiles.
 *
 * On SSE disconnect it re-fetches GET /board to resync state, then
 * reconnects the event stream.
 */
export default function GameBoard() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // ── Redux game state (populated by SSE events) ────────────────────────
  const {
    teamAName, teamBName,
    teamAScore, teamBScore,
    currentQuestion, revealedTiles, currentStrikes,
    playState, winner,
  } = useSelector((s: RootState) => s.gameState);

  // ── Board snapshot — used on initial load and reconnect ───────────────
  const { data: board, refetch: refetchBoard } = useGetBoardQuery(gameCode);

  useEffect(() => {
    if (!board) return;
    dispatch(applyBoardSnapshot(board));
  }, [board, dispatch]);

  const handleDisconnect = useCallback(async () => {
    try {
      const board = await refetchBoard().unwrap();
      dispatch(applyBoardSnapshot(board));
    } catch {
      // Silently retry — SSE hook will attempt reconnect
    }
  }, [refetchBoard, dispatch]);

  // ── SSE connection ─────────────────────────────────────────────────────
  useGameEvents(gameCode, handleDisconnect);

  // ── Build tile array from Redux state ─────────────────────────────────
  const tiles = Array.from(
    { length: currentQuestion?.totalOptions ?? 0 },
    (_, i) => {
      const rank = i + 1;
      const revealed = revealedTiles.find((t) => t.rank === rank);
      return { rank, revealed };
    },
  );

  // ── Game finished — show winner banner ────────────────────────────────
  if (playState === 'FINISHED' || winner) {
    return (
      <FullScreenBoard gameCode={gameCode}>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="marquee-frame stage-panel rounded-[2.4rem] px-6 py-10 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Trophy className="size-10" />
            </div>
            <h2 className="mt-5 text-4xl font-extrabold text-accent">Game Over!</h2>
          <p className="text-xl font-semibold">
            Winner: {winner?.teamName ?? '—'}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="text-center">
              <div className="rounded-[1.6rem] bg-background/90 px-5 py-5 shadow-sm">
                <div className="text-sm text-muted-foreground">{teamAName}</div>
                <div className="mt-2 text-4xl font-black text-primary">{winner?.teamATotal ?? teamAScore}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-[1.6rem] bg-background/90 px-5 py-5 shadow-sm">
                <div className="text-sm text-muted-foreground">{teamBName}</div>
                <div className="mt-2 text-4xl font-black text-primary">{winner?.teamBTotal ?? teamBScore}</div>
              </div>
            </div>
          </div>
          <button
            className="mt-8 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground"
            onClick={() => navigate('/')}
          >
            Home
          </button>
        </div>
        </div>
      </FullScreenBoard>
    );
  }

  // ── Lobby / waiting state ────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <FullScreenBoard gameCode={gameCode}>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="marquee-frame stage-panel flex flex-col items-center justify-center gap-4 rounded-[2.4rem] px-6 py-16 text-center">
            <Loader2 className="size-12 animate-spin text-primary" />
            <h2 className="text-3xl font-black text-primary">Waiting for the game to start…</h2>
            <p className="max-w-md text-sm leading-6 text-primary/10">
              The board is armed and ready. As soon as the host goes live, this page will switch
              into the active round automatically.
            </p>
          </div>
        </div>
      </FullScreenBoard>
    );
  }

  // ── Live board ────────────────────────────────────────────────────────

  return (
    <FullScreenBoard gameCode={gameCode}>
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-5">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
          <TeamScoreCard teamName={teamAName} score={teamAScore} className="text-center" />

          <div className="marquee-frame stage-panel rounded-[2.2rem] px-5 py-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary">Round {currentQuestion.roundNumber}</Badge>
              <span className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                <Radio className="size-3" />
                Live Board
              </span>
            </div>
            <CardTitle className="mx-auto mt-4 max-w-3xl text-2xl leading-tight sm:text-3xl">
              {currentQuestion.text}
            </CardTitle>
            <div className="mt-4 flex justify-center">
              <StrikeMarks count={currentStrikes} />
            </div>
          </div>

          <TeamScoreCard teamName={teamBName} score={teamBScore} className="text-center" />
        </div>

        <div className="mt-5">
          <Card className="rounded-[2.2rem] border-none bg-transparent shadow-none">
            <CardContent className={`grid gap-3 px-0 pb-0 ${tiles.length > 4 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
              {tiles.map(({ rank, revealed }) => (
                <AnswerTile
                  key={rank}
                  rank={rank}
                  revealed={!!revealed}
                  optionText={revealed?.optionText}
                  points={revealed?.points}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </FullScreenBoard>
  );
}

// ── Shared wrapper for full-screen board layout ────────────────────────────

function FullScreenBoard({
  children,
  gameCode,
}: {
  children: React.ReactNode;
  gameCode: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(254,208,27,0.28),transparent_28%),linear-gradient(180deg,#fff7fd_0%,#f5e2ff_55%,#f2ddff_100%)]">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <Tv2 className="size-4" />
          Feud
          </div>
          <span className="rounded-full bg-background/90 px-3 py-1 font-mono text-xs text-foreground shadow-sm">{gameCode}</span>
        </div>
      </div>

      {children}
    </div>
  );
}
