import { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2, Radio, Trophy, Tv2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnswerTile } from '@/components/game/AnswerTile';
import { StrikeMarks } from '@/components/game/StrikeMarks';
import { TeamScoreCard } from '@/components/game/TeamScoreCard';
import { useGameEvents } from '@/hooks/useGameEvents';
import { useGetBoardQuery } from '@/store/api/playerApi';
import { applyBoardSnapshot } from '@/store/slices/gameStateSlice';
import type { RootState, AppDispatch } from '@/store';

export default function GameBoard() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    teamAName, teamBName,
    teamAScore, teamBScore,
    currentQuestion, revealedTiles, currentStrikes,
    playState, winner,
  } = useSelector((s: RootState) => s.gameState);

  const { data: board, refetch: refetchBoard } = useGetBoardQuery(gameCode);

  useEffect(() => {
    if (!board) return;
    dispatch(applyBoardSnapshot(board));
  }, [board, dispatch]);

  const handleDisconnect = useCallback(async () => {
    try {
      const snapshot = await refetchBoard().unwrap();
      dispatch(applyBoardSnapshot(snapshot));
    } catch {
      // Silent retry; the SSE hook will keep reconnecting.
    }
  }, [refetchBoard, dispatch]);

  useGameEvents(gameCode, handleDisconnect);

  const tiles = Array.from(
    { length: currentQuestion?.totalOptions ?? 0 },
    (_, index) => {
      const rank = index + 1;
      const revealed = revealedTiles.find((tile) => tile.rank === rank);
      return { rank, revealed };
    },
  );

  if (playState === 'FINISHED' || winner) {
    return (
      <FullScreenBoard gameCode={gameCode}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="marquee-frame theme-panel-strong rounded-[2.6rem] px-6 py-10 text-center shadow-glow">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Trophy className="size-10" />
            </div>
            <h2 className="mt-5 text-4xl font-extrabold text-foreground">Game Over!</h2>
            <p className="mt-2 text-xl font-semibold text-foreground/80">
              Winner: <span className="text-primary">{winner?.teamName ?? '—'}</span>
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-background/85 px-5 py-5 shadow-sm">
                <div className="text-sm text-muted-foreground">{teamAName}</div>
                <div className="mt-2 text-4xl font-black text-primary">{winner?.teamATotal ?? teamAScore}</div>
              </div>
              <div className="rounded-[1.75rem] bg-background/85 px-5 py-5 shadow-sm">
                <div className="text-sm text-muted-foreground">{teamBName}</div>
                <div className="mt-2 text-4xl font-black text-primary">{winner?.teamBTotal ?? teamBScore}</div>
              </div>
            </div>
            <Button className="mt-8 rounded-full px-8" onClick={() => navigate('/')}>
              Home
            </Button>
          </div>
        </div>
      </FullScreenBoard>
    );
  }

  if (!currentQuestion) {
    return (
      <FullScreenBoard gameCode={gameCode}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="marquee-frame theme-panel-strong flex flex-col items-center justify-center gap-4 rounded-[2.6rem] px-6 py-16 text-center shadow-glow">
            <Loader2 className="size-12 animate-spin text-primary" />
            <h2 className="text-3xl font-black text-foreground">Waiting for the game to start…</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              The board is ready. As soon as the host starts the round, this page will switch into the active question automatically.
            </p>
          </div>
        </div>
      </FullScreenBoard>
    );
  }

  return (
    <FullScreenBoard gameCode={gameCode}>
      <div className="mx-auto max-w-384 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)_minmax(15rem,18rem)]">
          <TeamScoreCard teamName={teamAName} score={teamAScore} className="min-h-48 text-center" />

          <div className="marquee-frame theme-panel-strong rounded-[2.4rem] px-6 py-6 text-center shadow-glow">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary">Round {currentQuestion.roundNumber}</Badge>
              <span className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                <Radio className="size-3" />
                Live Board
              </span>
            </div>
            <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {currentQuestion.text}
            </h1>
            <div className="mt-5 flex justify-center">
              <StrikeMarks count={currentStrikes} />
            </div>
          </div>

          <TeamScoreCard teamName={teamBName} score={teamBScore} className="min-h-48 text-center" />
        </div>

        <div className={`mt-6 grid gap-4 ${tiles.length > 4 ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
          {tiles.map(({ rank, revealed }) => (
            <AnswerTile
              key={rank}
              rank={rank}
              revealed={!!revealed}
              optionText={revealed?.optionText}
              points={revealed?.points}
            />
          ))}
        </div>
      </div>
    </FullScreenBoard>
  );
}

function FullScreenBoard({
  children,
  gameCode,
}: {
  children: ReactNode;
  gameCode: string;
}) {
  return (
    <div className="stage-grid spotlight-wash min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/88 backdrop-blur-sm">
        <div className="mx-auto flex max-w-384 items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-black text-primary">
            <Tv2 className="size-4" />
            Feud Board
          </div>
          <span className="rounded-full border border-border/60 bg-card/90 px-3 py-1 font-mono text-xs text-foreground shadow-sm">
            {gameCode}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
