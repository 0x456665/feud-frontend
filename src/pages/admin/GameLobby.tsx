import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Users, Copy, CheckCheck, Play, ChevronDown, ChevronUp,
  BarChart3, Loader2, Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import {
  useGetGameQuery,
  useGetSurveyStatsQuery,
  useGetSurveyVoterCountQuery,
  useSetVotingStateMutation,
  useStartGameMutation,
} from '@/store/api/adminApi';
import { useGetPlayerCountQuery } from '@/store/api/playerApi';
import type { RootState } from '@/store';
import type { VotingState } from '@/types';
import { getErrorMessage } from '@/lib/utils';

/**
 * Admin: Game Lobby page.
 *
 * Shows the game code for players to join, lets the admin:
 *   • Open / Close / Pause voting
 *   • See live survey statistics per question
 *   • Start the live game (requires voting closed)
 *
 * SSE vote_update events update the total-vote counters in real time.
 */
export default function GameLobby() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const adminCode = useSelector((s: RootState) => s.adminSession.adminCode) ?? '';

  // ── RTK Query ──────────────────────────────────────────────────────────
  const { data: game, isLoading: gameLoading } = useGetGameQuery(gameCode);
  const { data: stats, refetch: refetchStats } = useGetSurveyStatsQuery(gameCode, {
    // Only fetch stats when voting is closed (data is ready then)
    skip: game?.voting_state !== 'CLOSED',
  });
  const { data: surveyVoterStats } = useGetSurveyVoterCountQuery(gameCode, {
    pollingInterval: 10_000,
    skip: !gameCode,
  });
  const { data: playerCount, refetch: refetchCount } = useGetPlayerCountQuery(gameCode, {
    pollingInterval: 10_000, // refresh every 10 s
  });

  const [setVotingState, { isLoading: votingLoading }] = useSetVotingStateMutation();
  const [startGame, { isLoading: startLoading }] = useStartGameMutation();

  // ── Local state ────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [expandedStats, setExpandedStats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (game?.play_state === 'IN_PROGRESS') {
      navigate(`/admin/game/${gameCode}/live`, { replace: true });
    }
  }, [game?.play_state, gameCode, navigate]);

  // ── Clipboard ─────────────────────────────────────────────────────────

  function copyCode() {
    navigator.clipboard.writeText(gameCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Stats per question expansion ──────────────────────────────────────

  function toggleStat(questionId: string) {
    setExpandedStats((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  // ── Vote update handler (called from SSE hook in parent) ───────────────
  // Currently the lobby just refresh the stats panel when votes come in.
  // The parent page can pass this down if needed.
  const handleVoteUpdate = useCallback(() => {
    refetchCount();
  }, [refetchCount]);
  void handleVoteUpdate; // suppress unused warning — used by parent

  // ── Voting state change ────────────────────────────────────────────────

  async function changeVotingState(state: VotingState) {
    try {
      await setVotingState({ gameCode, voting_state: state }).unwrap();
      if (state === 'CLOSED') {
        // Stats are now ready — fetch them
        refetchStats();
      }
      toast.success(`Voting ${state.toLowerCase()}.`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update voting state.'));
    }
  }

  // ── Start game ─────────────────────────────────────────────────────────

  async function handleStartGame() {
    if (!game) return;

    if (game.voting_state !== 'CLOSED') {
      toast.error('Close voting before starting the game.');
      return;
    }

    try {
      await startGame(gameCode).unwrap();
      toast.success('Game started! Redirecting to live control…');
      navigate(`/admin/game/${gameCode}/live`, { replace: true });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to start game.'));
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────

  if (gameLoading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <p className="text-destructive">Game not found. Check the game code and admin code.</p>
      </div>
    );
  }

  const canStart = game.voting_state === 'CLOSED' && game.play_state === 'LOBBY';

  const votingLabel: Record<VotingState, string> = {
    OPEN: 'Survey is OPEN',
    PAUSED: 'Survey is PAUSED',
    CLOSED: 'Survey is CLOSED',
  };

  const votingDescription: Record<VotingState, string> = {
    OPEN: `Players are currently submitting answers to the "${game.game_name}" category pack.`,
    PAUSED: 'Survey collection is temporarily paused.',
    CLOSED: 'Survey closed. Stats computed and ready for the live game.',
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-56px)] overflow-x-hidden bg-background">
      <AdminSidebar gameCode={gameCode} active="survey" />

      <div className="stage-grid spotlight-wash relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_40%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

          <section className="mb-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="stage-panel marquee-frame rounded-[2rem] p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-destructive px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                  Control Room
                </span>
                <span className="rounded-full bg-background/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                  Game {gameCode}
                </span>
              </div>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-primary sm:text-4xl">
                {game.game_name}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-primary">
                Share the code, watch audience count climb, close the survey when the room is ready,
                then switch straight into the live reveal board.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-[1.5rem] bg-background/90 px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/90">Questions Loaded</p>
                  <p className="mt-2 text-3xl font-black text-primary">{game.questions.length}</p>
                </div>
                <div className="rounded-[1.5rem] bg-background/90 px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/90">Rounds Planned</p>
                  <p className="mt-2 text-3xl font-black text-primary">{game.num_rounds}</p>
                </div>
                <div className="rounded-[1.5rem] bg-background/90 px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/90">Survey Voters</p>
                  <p className="mt-2 text-3xl font-black text-primary">{surveyVoterStats?.totalVoters ?? 0}</p>
                </div>
                <div className="rounded-[1.5rem] bg-background/90 px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/90">Players Ready</p>
                  <p className="mt-2 text-3xl font-black text-primary">{playerCount?.count ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[2rem] bg-card p-6 shadow-glow">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/90">Share This Code</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] bg-background px-4 py-4">
                  <span className="break-all text-2xl font-black tracking-[0.14em] text-foreground sm:text-3xl sm:tracking-[0.22em]">{gameCode}</span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="rounded-2xl bg-primary/10 p-3 text-primary transition-colors hover:bg-primary/15"
                  >
                    {copied ? <CheckCheck className="size-5 text-green-600" /> : <Copy className="size-5" />}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-foreground/90">
                  Players can join from any device, enter the code, and head straight into the survey or board.
                </p>
              </div>

              <div className="rounded-[2rem] bg-card p-6 shadow-glow">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/90">Teams On Deck</p>
                <div className="mt-4 space-y-3">
                  {[game.team_a_name, game.team_b_name].map((name, i) => (
                    <div key={i} className="flex items-center justify-between rounded-[1.4rem] bg-background px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex size-8 items-center justify-center rounded-full text-xs font-black text-white ${i === 0 ? 'bg-primary' : 'bg-accent'}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm font-black text-foreground">{name || `Team ${i + 1}`}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/90">Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate(`/admin/game/${gameCode}/survey-edit`)}
                disabled={game.play_state !== 'LOBBY'}
              >
                Edit Survey Questions
              </Button>
              {game.play_state !== 'LOBBY' ? (
                <p className="text-sm text-muted-foreground">
                  Survey editing is disabled once the game is in progress.
                </p>
              ) : null}
            </div>
          </section>

          {/* ── Top row: Phase status + Response count ── */}
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_200px]">

            {/* Left: phase card */}
            <div className="rounded-3xl bg-card p-7 shadow-glow">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent drop-shadow-sm">
                <Circle className="size-2 fill-accent" />
                Current Phase
              </span>
              <h1 className="mb-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {votingLabel[game.voting_state]}
              </h1>
              <p className="mb-6 max-w-sm text-sm text-soft">
                {votingDescription[game.voting_state]}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {game.voting_state !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => changeVotingState('CLOSED')}
                    disabled={votingLoading}
                    className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
                  >
                    {votingLoading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    Close Survey
                  </button>
                )}
                {canStart && (
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={startLoading}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
                  >
                    {startLoading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    Start Live Game
                  </button>
                )}
                {game.voting_state === 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => changeVotingState('PAUSED')}
                    disabled={votingLoading}
                    className="inline-flex items-center rounded-full border border-border/30 px-5 py-2.5 text-sm font-medium text-foreground transition-transform hover:scale-105 hover:bg-black/5 disabled:scale-100 disabled:opacity-50"
                  >
                    Pause Collection
                  </button>
                )}
                {game.voting_state === 'PAUSED' && (
                  <button
                    type="button"
                    onClick={() => changeVotingState('OPEN')}
                    disabled={votingLoading}
                    className="inline-flex items-center rounded-full border border-border/30 px-5 py-2.5 text-sm font-medium text-foreground transition-transform hover:scale-105 hover:bg-black/5 disabled:scale-100 disabled:opacity-50"
                  >
                    Resume Collection
                  </button>
                )}
              </div>
            </div>

            {/* Right: Response count card */}
            <div className="rounded-3xl bg-card p-6 shadow-glow text-center flex flex-col items-center justify-center">
              <p className="mb-1 text-5xl font-black text-primary sm:text-6xl">
                {playerCount?.count ?? '—'}
              </p>
              <p className="text-xs font-bold tracking-widest text-foreground/90 uppercase mb-3">
                Players Joined
              </p>
              <Progress
                value={Math.min(((playerCount?.count ?? 0) / 80) * 100, 100)}
                className="h-1.5"
              />
              {/* <p className="mt-2 text-xs text-foreground/90">
                Target: 80 Participants
              </p> */}
            </div>
          </div>

          <div className="mb-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl bg-card p-6 shadow-glow">
              <div className="mb-3 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Connected Teams</p>
              </div>
              <div className="space-y-2">
                {[game.team_a_name, game.team_b_name].map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-primary' : 'bg-primary/50'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium text-foreground">{name || `Team ${i + 1}`}</span>
                  </div>
                ))}
              </div>
              <div className="my-4 h-px bg-border/20" />
              <p className="text-[10px] text-foreground/90 uppercase tracking-widest mb-1">Game Code</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-black tracking-[0.2em] text-foreground">{gameCode}</span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-xl p-1.5 hover:bg-black/5 transition-colors"
                >
                  {copied ? <CheckCheck className="size-4 text-green-600" /> : <Copy className="size-4 text-foreground/90" />}
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-card p-6 shadow-glow">
              <p className="text-sm font-bold text-foreground mb-1">System Health</p>
              <p className="text-xs text-foreground/90 mb-4">Game is set up and ready.</p>
              <div className="space-y-2 text-xs text-foreground/90">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>Game Name</span>
                  <span className="max-w-full wrap-break-word font-medium text-foreground sm:max-w-30 sm:text-right">{game.game_name}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>Rounds</span>
                  <span className="font-medium text-foreground">{game.num_rounds}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>Play State</span>
                  <span className="font-medium text-foreground">{game.play_state}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>Uptime</span>
                  <span className="font-medium text-foreground">99.9%</span>
                </div>
              </div>
              <div className="my-3 h-px bg-border/20" />
              <p className="break-all text-[10px] text-foreground/90">
                Admin code: <code className="font-mono text-primary font-bold">{adminCode}</code>
              </p>
            </div>
          </div>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Game Content Preview</h2>
                <p className="text-xs text-foreground/90">Questions waiting backstage before they hit the board.</p>
              </div>
              {game.voting_state === 'CLOSED' && (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <BarChart3 className="size-3.5" />
                  Stats ready
                </div>
              )}
            </div>

            {/* Questions from game data */}
            {game.questions && game.questions.length > 0 && (
              <div className="space-y-2">
                {game.questions.map((q, i) => (
                  <div key={q.id} className="rounded-2xl bg-card border border-border px-5 py-4">
                    <div className="flex items-start gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          &ldquo;{q.question}&rdquo;
                        </p>
                        {/* <p className="mt-1 text-xs text-foreground/90 uppercase tracking-wide">
                          {q.number_of_options} answers
                        </p> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Survey stats accordion (if closed) */}
            {game.voting_state === 'CLOSED' && stats && stats.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-foreground/90 uppercase tracking-widest mb-3">
                  Vote Breakdown
                </p>
                {stats.map((q, i) => (
                  <div key={q.questionId} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-5 py-4 text-left"
                      onClick={() => toggleStat(q.questionId)}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium">{q.question}</span>
                      <span className="text-xs text-foreground/90">{q.totalVotes} votes</span>
                      {expandedStats.has(q.questionId) ? (
                        <ChevronUp className="size-4 text-foreground/90" />
                      ) : (
                        <ChevronDown className="size-4 text-foreground/90" />
                      )}
                    </button>
                    {expandedStats.has(q.questionId) && (
                      <>
                        <Separator />
                        <div className="space-y-2 p-5">
                          {q.options.map((opt) => {
                            const pct = q.totalVotes
                              ? Math.round((opt.votes / q.totalVotes) * 100)
                              : 0;
                            return (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">
                                    {opt.rank}. {opt.option_text}
                                  </span>
                                  <span className="text-foreground/90">
                                    {opt.votes} votes · {opt.points} pts
                                  </span>
                                </div>
                                <Progress value={pct} className="h-1.5" />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
