import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useGetBoardQuery } from '@/store/api/playerApi';
import { applyBoardSnapshot } from '@/store/slices/gameStateSlice';
import type { RootState, AppDispatch } from '@/store';

/**
 * Game End / Results page.
 *
 * Shown after the end_game SSE event fires.
 * Reads the final state from Redux (populated by the end_game event).
 */
export default function GameEnd() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const { data: board } = useGetBoardQuery(gameCode, { skip: !gameCode });

  useEffect(() => {
    if (!board) return;
    dispatch(applyBoardSnapshot(board));
  }, [board, dispatch]);

  const { winner, teamAName, teamBName, teamAScore, teamBScore } = useSelector(
    (s: RootState) => s.gameState,
  );

  const aTotal = winner?.teamATotal ?? teamAScore;
  const bTotal = winner?.teamBTotal ?? teamBScore;
  const aName = winner?.teamAName ?? teamAName;
  const bName = winner?.teamBName ?? teamBName;
  const winnerName = winner?.teamName ?? '—';
  const winningTeam = winner?.team;

  return (
    <PageWrapper className="flex flex-col items-center py-16 text-center">
      {/* Trophy */}
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-accent/20">
        <Trophy className="size-10 text-accent" />
      </div>

      <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-foreground/75">
        And the winner is…
      </p>
      <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-primary">
        {winnerName}
      </h1>

      {/* Final scores */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <div
          className={`flex items-center justify-between rounded-xl px-5 py-3 text-sm font-semibold ${
            winningTeam === 'TEAM_A'
              ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
              : 'bg-card ring-1 ring-border text-foreground'
          }`}
        >
          <span className={winningTeam === 'TEAM_A' ? '' : 'text-foreground/80'}>{aName}</span>
          <span className="text-2xl font-extrabold tabular-nums">{aTotal}</span>
        </div>
        <div
          className={`flex items-center justify-between rounded-xl px-5 py-3 text-sm font-semibold ${
            winningTeam === 'TEAM_B'
              ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
              : 'bg-card ring-1 ring-border text-foreground'
          }`}
        >
          <span className={winningTeam === 'TEAM_B' ? '' : 'text-foreground/80'}>{bName}</span>
          <span className="text-2xl font-extrabold tabular-nums">{bTotal}</span>
        </div>
      </div>

      <Separator className="my-8 max-w-xs" />

      <Button onClick={() => navigate('/')} className="gap-2">
        <Home className="size-4" />
        Back to Home
      </Button>
    </PageWrapper>
  );
}
