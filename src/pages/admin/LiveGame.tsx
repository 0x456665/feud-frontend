import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {  X, Plus, Trophy, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AnswerTile } from '@/components/game/AnswerTile';
import { StrikeMarks } from '@/components/game/StrikeMarks';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import {
  useNextQuestionMutation,
  useRevealOptionMutation,
  useWrongAnswerMutation,
  useAddScoreMutation,
  useEndGameMutation,
  useGetGameQuery,
  useGetAdminLogQuery,
} from '@/store/api/adminApi';
import { applyBoardSnapshot, setTeamNames } from '@/store/slices/gameStateSlice';
import { useGameEvents } from '@/hooks/useGameEvents';
import type { RootState, AppDispatch } from '@/store';
import type { Team } from '@/types';

/**
 * Admin: Live Game Control page.
 *
 * Hosts the game in real time:
 *   • Next Question — advance rounds
 *   • Reveal Option — flip answer tiles
 *   • Wrong Answer   — record strikes per team
 *   • Add Score      — award points to a team
 *   • End Game       — finish the session
 *
 * Live board state is driven by SSE events (via useGameEvents hook).
 * On reconnect, the admin log snapshot is fetched to restore state.
 */
export default function LiveGame() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const adminCode = useSelector((s: RootState) => s.adminSession.adminCode) ?? '';
  void adminCode; // passed automatically via RTK Query headers

  // ── Game state from Redux (driven by SSE) ─────────────────────────────
  const {
    teamAName, teamBName,
    teamAScore, teamBScore,
    currentQuestion, revealedTiles, currentStrikes,
    playState, winner,
  } = useSelector((s: RootState) => s.gameState);

  // ── RTK Query ──────────────────────────────────────────────────────────
  const { data: game } = useGetGameQuery(gameCode);
  const { data: logSnapshot, refetch: refetchLog } = useGetAdminLogQuery(gameCode);

  const [nextQuestion, { isLoading: nextLoading }] = useNextQuestionMutation();
  const [revealOption] = useRevealOptionMutation();
  const [wrongAnswer] = useWrongAnswerMutation();
  const [addScore, { isLoading: scoreLoading }] = useAddScoreMutation();
  const [endGame, { isLoading: endLoading }] = useEndGameMutation();

  // ── Reconnect handler — rebuild state from server snapshot ────────────
  const handleDisconnect = useCallback(async () => {
    try {
      const log = await refetchLog().unwrap();
      dispatch(applyBoardSnapshot(log));
      toast.info('Reconnected to game stream.');
    } catch {
      toast.error('Stream disconnected. Refresh to reconnect.');
    }
  }, [refetchLog, dispatch]);

  // ── Seed team names from game data ────────────────────────────────────
  useEffect(() => {
    if (!game) return;
    if (game.team_a_name === teamAName && game.team_b_name === teamBName) return;

    dispatch(setTeamNames({ teamAName: game.team_a_name, teamBName: game.team_b_name }));
  }, [dispatch, game, teamAName, teamBName]);

  useEffect(() => {
    if (!logSnapshot) return;
    dispatch(applyBoardSnapshot(logSnapshot));
  }, [dispatch, logSnapshot]);

  // ── SSE connection ─────────────────────────────────────────────────────
  useGameEvents(gameCode, handleDisconnect);

  // ── Local UI state ─────────────────────────────────────────────────────
  const [confirmedEnd, setConfirmedEnd] = useState(false);

  // ── Derived data ───────────────────────────────────────────────────────
  // Find the current question's unrevealed options for the reveal buttons
  const currentQuestionDetails = game?.questions.find(
    (q) => q.id === currentQuestion?.id,
  );

  const revealedOptionIds = new Set(revealedTiles.map((t) => t.optionId));
  const unrevealedOptions = currentQuestionDetails?.options.filter(
    (o) => !revealedOptionIds.has(o.id),
  ) ?? [];

  // Build display tiles: revealed data from Redux, blanks for the rest
  const tiles = Array.from(
    { length: currentQuestion?.totalOptions ?? 0 },
    (_, i) => {
      const rank = i + 1;
      const revealed = revealedTiles.find((t) => t.rank === rank);
      return { rank, revealed };
    },
  );

  // ── Actions ────────────────────────────────────────────────────────────

  async function handleNextQuestion() {
    try {
      await nextQuestion(gameCode).unwrap();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not advance question.');
    }
  }

  async function handleReveal(optionId: string) {
    try {
      await revealOption({ gameCode, optionId }).unwrap();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not reveal option.');
    }
  }

  async function handleWrongAnswer(team: Team) {
    try {
      await wrongAnswer({ gameCode, team }).unwrap();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not record strike.');
    }
  }

  async function handleAddScore(team: Team) {
    // Award all points from revealed tiles this round
    const total = revealedTiles.reduce((sum, t) => sum + t.points, 0);
    if (total === 0) {
      toast.warning('No points to award — reveal answers first.');
      return;
    }
    try {
      await addScore({ gameCode, team, points: total }).unwrap();
      toast.success(`${total} pts awarded to ${team === 'TEAM_A' ? teamAName : teamBName}.`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not add score.');
    }
  }

  async function handleEndGame() {
    if (!confirmedEnd) {
      setConfirmedEnd(true);
      return;
    }
    try {
      await endGame(gameCode).unwrap();
      toast.success('Game over!');
      navigate(`/game/${gameCode}/end`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not end game.');
    }
  }

  // ── Game over ─────────────────────────────────────────────────────────
  if (playState === 'FINISHED' || winner) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-background">
        <div className="text-center px-6">
          <Trophy className="mx-auto mb-4 size-16 text-secondary" />
          <h1 className="text-5xl font-black tracking-tight text-foreground">Game Over!</h1>
          <p className="mt-2 text-foreground/90">
            Winner: <strong className="text-primary">{winner?.teamName ?? '\u2014'}</strong>
          </p>
          <div className="mt-6 flex justify-center gap-8 text-lg font-bold">
            <div className="text-center">
              <div className="text-xs text-foreground/90 uppercase tracking-widest">{teamAName}</div>
              <div className="text-3xl font-black text-primary">{teamAScore}</div>
            </div>
            <div className="text-2xl text-foreground/90 self-center">vs</div>
            <div className="text-center">
              <div className="text-xs text-foreground/90 uppercase tracking-widest">{teamBName}</div>
              <div className="text-3xl font-black text-primary">{teamBScore}</div>
            </div>
          </div>
          <Button className="mt-8" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] overflow-x-hidden bg-background">
      <AdminSidebar
        gameCode={gameCode}
        active="live"
        variant="live"
        bottomSlot={
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-muted p-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">Admin User</p>
                <p className="text-[10px] text-foreground">Session #{gameCode}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEndGame}
              disabled={endLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-destructive py-3 text-xs font-black uppercase tracking-wider text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
            >
              {endLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {confirmedEnd ? 'Confirm End' : 'End Game'}
            </button>
            {confirmedEnd && (
              <p className="text-center text-[10px] text-destructive">
                Click again to confirm.
              </p>
            )}
          </div>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border/30 bg-background/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="text-sm font-bold text-foreground/90">
            {currentQuestion ? `Round ${currentQuestion.roundNumber}` : 'No Round Active'}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Live Status: On Air
            </span>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={nextLoading}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {nextLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {currentQuestion ? 'Next Question' : 'Go Live'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
          {/* Left: Question board */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-5">
              {currentQuestion ? (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-[10px] font-black tracking-widest text-accent uppercase">
                      Active Question
                    </span>
                    <span className="text-sm font-black text-foreground sm:ml-auto">
                      Total Points On Board{' '}
                      <span className="text-xl text-primary">
                        {revealedTiles.reduce((s, t) => s + t.points, 0)}
                      </span>
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {currentQuestion.text}
                  </h2>
                  <div className="mt-2">
                    <StrikeMarks count={currentStrikes} />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-muted p-6 text-center text-foreground">
                  <p className="font-medium">No question loaded.</p>
                  <p className="text-sm">Click “Go Live” to begin.</p>
                </div>
              )}
            </div>

            {tiles.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tiles.map(({ rank, revealed }) => {
                  const unrevOption = currentQuestionDetails?.options.find(
                    (o) => o.rank === rank && !revealedOptionIds.has(o.id),
                  );
                  return (
                    <div key={rank} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        {rank}
                      </span>
                      {revealed ? (
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{revealed.optionText}</p>
                          <p className="text-xs text-foreground/90">{revealed.points} Points</p>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 text-sm text-foreground/90 italic">Hidden</div>
                      )}
                      {revealed ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase">
                          Revealed
                        </span>
                      ) : unrevOption ? (
                        <button
                          type="button"
                          onClick={() => handleReveal(unrevOption.id)}
                          className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground uppercase hover:bg-primary/90"
                        >
                          Reveal
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hidden AnswerTile components keep SSE-powered board state working */}
            <div className="hidden">
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

            {unrevealedOptions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {unrevealedOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleReveal(opt.id)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Eye className="size-3 text-primary" />
                    {opt.option_text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="w-full shrink-0 overflow-y-auto border-t border-border/30 p-4 space-y-4 xl:w-64 xl:border-t-0 xl:border-l">
            {/* Team Scores */}
            <div className="rounded-[2rem] bg-card p-4 shadow-glow">
              <p className="mb-3 text-[10px] font-black tracking-widest text-foreground uppercase">
                Team Scores
              </p>
              <div className="space-y-3">
                {(
                  [
                    { name: teamAName, score: teamAScore, team: 'TEAM_A' as Team, isPrimary: true },
                    { name: teamBName, score: teamBScore, team: 'TEAM_B' as Team, isPrimary: false },
                  ] as const
                ).map(({ name, score, team, isPrimary }) => (
                  <div key={team} className="rounded-xl bg-card p-3 shadow-glow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/90">
                        {name || team}
                      </span>
                      <span className="text-xl font-black text-foreground">{score}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddScore(team)}
                        disabled={scoreLoading || !currentQuestion}
                        className={`flex flex-1 items-center justify-center rounded-xl py-1.5 text-sm font-black text-white transition-colors disabled:opacity-50 ${isPrimary ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'}`}
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWrongAnswer(team)}
                        disabled={!currentQuestion}
                        className="flex flex-1 items-center justify-center rounded-xl bg-muted-foreground/20 py-1.5 text-sm font-black text-foreground hover:bg-muted-foreground/30 transition-colors disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strikes */}
            <div className="rounded-2xl bg-card shadow-glow p-4">
              <p className="mb-3 text-[10px] font-black tracking-widest text-foreground uppercase">
                Current Strikes
              </p>
              <StrikeMarks count={currentStrikes} className="justify-center" />
              <p className="mt-3 text-[10px] text-foreground/90 text-center">
                Pressing X adds a strike on board.
              </p>
            </div>

            {/* Next Question */}
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={nextLoading}
              className="w-full rounded-2xl bg-secondary py-4 text-sm font-black uppercase tracking-wider text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
            >
              {nextLoading ? (
                <Loader2 className="mx-auto size-5 animate-spin" />
              ) : (
                'Next Question'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
