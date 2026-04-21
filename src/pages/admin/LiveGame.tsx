import { useState, useCallback, useEffect } from 'react';
import type { ComponentProps } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Eye, Loader2, Plus, Radio, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AnswerTile } from '@/components/game/AnswerTile';
import { StrikeMarks } from '@/components/game/StrikeMarks';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import {
  useStartGameMutation,
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

interface PendingAction {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: ComponentProps<typeof Button>['variant'];
  action: () => Promise<void>;
}

export default function LiveGame() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    teamAName, teamBName,
    teamAScore, teamBScore,
    currentQuestion, revealedTiles, currentStrikes,
    playState, winner,
  } = useSelector((s: RootState) => s.gameState);

  const { data: game } = useGetGameQuery(gameCode);
  const { data: logSnapshot, refetch: refetchLog } = useGetAdminLogQuery(gameCode);

  const [startGame, { isLoading: startLoading }] = useStartGameMutation();
  const [nextQuestion, { isLoading: nextLoading }] = useNextQuestionMutation();
  const [revealOption] = useRevealOptionMutation();
  const [wrongAnswer, { isLoading: strikeLoading }] = useWrongAnswerMutation();
  const [addScore, { isLoading: scoreLoading }] = useAddScoreMutation();
  const [endGame, { isLoading: endLoading }] = useEndGameMutation();

  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null);

  const handleDisconnect = useCallback(async () => {
    try {
      const log = await refetchLog().unwrap();
      dispatch(applyBoardSnapshot(log));
      toast.info('Reconnected to game stream.');
    } catch {
      toast.error('Stream disconnected. Refresh to reconnect.');
    }
  }, [refetchLog, dispatch]);

  useEffect(() => {
    if (!game) return;
    if (game.team_a_name === teamAName && game.team_b_name === teamBName) return;

    dispatch(setTeamNames({ teamAName: game.team_a_name, teamBName: game.team_b_name }));
  }, [dispatch, game, teamAName, teamBName]);

  useEffect(() => {
    if (!logSnapshot) return;
    dispatch(applyBoardSnapshot(logSnapshot));
  }, [dispatch, logSnapshot]);

  useGameEvents(gameCode, handleDisconnect);

  const currentQuestionDetails = game?.questions.find((question) => question.id === currentQuestion?.id);
  const playableOptions = [...(currentQuestionDetails?.options ?? [])]
    .filter((option) => option.rank !== null)
    .sort((left, right) => (left.rank ?? 999) - (right.rank ?? 999));
  const revealedOptionIds = new Set(revealedTiles.map((tile) => tile.optionId));
  const unrevealedOptions = playableOptions.filter((option) => !revealedOptionIds.has(option.id));

  const tiles = Array.from(
    { length: currentQuestion?.totalOptions ?? playableOptions.length },
    (_, index) => {
      const rank = index + 1;
      const revealed = revealedTiles.find((tile) => tile.rank === rank);
      return { rank, revealed };
    },
  );
  const tileColumns = tiles.length > 3 ? 2 : 1;
  const revealedPoints = revealedTiles.reduce((sum, tile) => sum + tile.points, 0);
  const gameStarted = game?.play_state === 'IN_PROGRESS';

  const loadingAction = startLoading || nextLoading || strikeLoading || scoreLoading || endLoading;

  function requestConfirmation(action: PendingAction) {
    setConfirmAction(action);
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;

    try {
      await confirmAction.action();
    } finally {
      setConfirmAction(null);
    }
  }

  async function runNextQuestion() {
    try {
      if (!gameStarted) {
        if (game?.voting_state !== 'CLOSED') {
          toast.error('Close voting before starting the live game.');
          return;
        }

        await startGame(gameCode).unwrap();
      }

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

  async function runWrongAnswer(team: Team) {
    try {
      await wrongAnswer({ gameCode, team }).unwrap();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not record strike.');
    }
  }

  async function runAddScore(team: Team) {
    const total = revealedTiles.reduce((sum, tile) => sum + tile.points, 0);
    if (total === 0) {
      toast.warning('No points to award. Reveal answers first.');
      return;
    }

    try {
      await addScore({ gameCode, team, points: total }).unwrap();
      toast.success(`${total} pts awarded to ${team === 'TEAM_A' ? teamAName : teamBName}.`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not add score.');
    }
  }

  async function runEndGame() {
    try {
      await endGame(gameCode).unwrap();
      toast.success('Game over!');
      navigate(`/game/${gameCode}/end`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Could not end game.');
    }
  }

  if (playState === 'FINISHED' || winner) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="theme-panel-strong w-full max-w-3xl rounded-[2.4rem] px-6 py-10 text-center shadow-glow">
          <Trophy className="mx-auto mb-4 size-16 text-secondary" />
          <h1 className="text-5xl font-black tracking-tight text-foreground">Game Over!</h1>
          <p className="mt-2 text-foreground/80">
            Winner: <strong className="text-primary">{winner?.teamName ?? '—'}</strong>
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] bg-background/80 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{teamAName}</div>
              <div className="mt-2 text-4xl font-black text-primary">{teamAScore}</div>
            </div>
            <div className="rounded-[1.75rem] bg-background/80 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{teamBName}</div>
              <div className="mt-2 text-4xl font-black text-primary">{teamBScore}</div>
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
    <div className="flex h-svh overflow-hidden bg-background">
      <AdminSidebar
        gameCode={gameCode}
        active="live"
        variant="live"
        bottomSlot={
          <div className="space-y-3">
            <div className="rounded-[1.4rem] bg-muted/60 p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Live Session
              </p>
              <p className="mt-2 text-sm font-bold text-foreground">{gameCode}</p>
            </div>
            <Button
              variant="destructive"
              className="h-11 w-full rounded-2xl text-xs font-black uppercase tracking-[0.22em]"
              onClick={() => requestConfirmation({
                title: 'End the game?',
                description: 'This finalises the scores and moves every connected board to the end-game state.',
                confirmLabel: 'End game',
                confirmVariant: 'destructive',
                action: runEndGame,
              })}
              disabled={endLoading}
            >
              End Game
            </Button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-440 flex-wrap items-center gap-3">
            <div className="text-sm font-bold text-foreground/90">
              {currentQuestion ? `Round ${currentQuestion.roundNumber}` : 'No Round Active'}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
              <Radio className="size-3" />
              Live Status: On Air
            </div>
            <div className="ml-auto">
              <Button
                className="rounded-full px-4"
                onClick={() => requestConfirmation({
                  title: currentQuestion ? 'Load next question?' : gameStarted ? 'Load round one?' : 'Start live game?',
                  description: currentQuestion
                    ? 'This closes the current round and moves the board to the next ranked question.'
                    : gameStarted
                      ? 'This loads the first ranked question for all connected clients.'
                      : 'This starts the live game and immediately loads round one for all connected clients.',
                  confirmLabel: currentQuestion ? 'Next question' : gameStarted ? 'Load round one' : 'Start live game',
                  action: runNextQuestion,
                })}
                disabled={startLoading || nextLoading}
              >
                {startLoading || nextLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                {currentQuestion ? 'Next Question' : gameStarted ? 'Load Round 1' : 'Start Live Game'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
          <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-0 w-full max-w-440 flex-1 flex-col">
              {currentQuestion ? (
                <>
                  <div className="marquee-frame theme-panel-strong shrink-0 rounded-[2rem] px-4 py-4 shadow-glow sm:px-5 sm:py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-accent/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-accent">
                        Active Question
                      </span>
                      <span className="text-sm font-black text-foreground sm:ml-auto">
                        Revealed Points <span className="text-xl text-primary">{revealedPoints}</span>
                      </span>
                    </div>
                    <h2 className="mt-3 max-w-5xl text-2xl font-black leading-tight text-foreground sm:text-3xl lg:text-[2.4rem]">
                      {currentQuestion.text}
                    </h2>
                    <div className="mt-3">
                      <StrikeMarks count={currentStrikes} />
                    </div>
                  </div>

                  <div className="mt-4 min-h-0 flex-1">
                    <div
                      className="grid gap-3"
                      style={{
                        gridTemplateColumns: `repeat(${tileColumns}, minmax(0, 1fr))`,
                      }}
                    >
                      {tiles.map(({ rank, revealed }) => (
                        <AnswerTile
                          key={rank}
                          rank={rank}
                          revealed={!!revealed}
                          optionText={revealed?.optionText}
                          points={revealed?.points}
                          className="aspect-[8/1.7] min-h-0"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 shrink-0 rounded-[1.7rem] border border-border/70 bg-card/90 p-4 shadow-glow sm:rounded-[2rem] sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Eye className="size-4 text-primary" />
                      <p className="text-sm font-black text-foreground">Reveal Top Answers</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                      Only ranked board answers appear here. Zero-vote or overflow answers stay off the live board.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {unrevealedOptions.length > 0 ? unrevealedOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => void handleReveal(option.id)}
                          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
                        >
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                            {option.rank}
                          </span>
                          {option.option_text}
                        </button>
                      )) : (
                        <p className="text-sm text-muted-foreground">All top answers are already revealed.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="marquee-frame theme-panel-strong flex min-h-0 flex-1 flex-col items-center justify-center rounded-[2.1rem] px-6 py-12 text-center shadow-glow">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <h2 className="mt-5 text-3xl font-black text-foreground">No question loaded</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    Start the first round to push the opening question to every connected board.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 overflow-y-auto border-t border-border/30 bg-background/70 p-4 backdrop-blur xl:w-80 xl:border-l xl:border-t-0 xl:p-5">
            <div className="space-y-4">
              <div className="rounded-[2rem] border border-border/70 bg-card/90 p-4 shadow-glow">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Team Scores
                </p>
                <div className="space-y-3">
                  {(
                    [
                      { name: teamAName, score: teamAScore, team: 'TEAM_A' as Team, actionTone: 'primary' },
                      { name: teamBName, score: teamBScore, team: 'TEAM_B' as Team, actionTone: 'accent' },
                    ] as const
                  ).map(({ name, score, team, actionTone }) => {
                    const scoreToAdd = revealedPoints;
                    return (
                      <div key={team} className="rounded-[1.4rem] bg-background/80 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-foreground/85">
                            {name || team}
                          </span>
                          <span className="text-2xl font-black text-foreground">{score}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="default"
                            className={actionTone === 'accent' ? 'bg-accent text-accent-foreground hover:bg-accent/85' : ''}
                            onClick={() => requestConfirmation({
                              title: `Award ${name || team} this round?`,
                              description: scoreToAdd > 0
                                ? `${scoreToAdd} points from the revealed answers will be added to ${name || team}.`
                                : 'There are no revealed points yet, so this action will not award any score.',
                              confirmLabel: 'Add score',
                              action: () => runAddScore(team),
                            })}
                            disabled={scoreLoading || !currentQuestion}
                          >
                            <Plus className="size-4" />
                            Add Score
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => requestConfirmation({
                              title: `Add a strike to ${name || team}?`,
                              description: 'This will increment the visible strike counter on every connected board.',
                              confirmLabel: 'Add strike',
                              confirmVariant: 'destructive',
                              action: () => runWrongAnswer(team),
                            })}
                            disabled={strikeLoading || !currentQuestion}
                          >
                            <X className="size-4" />
                            Strike
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/70 bg-card/90 p-4 shadow-glow">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Current Strikes
                </p>
                <StrikeMarks count={currentStrikes} className="justify-center" />
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Strike actions are confirmed before they appear on the live board.
                </p>
              </div>

              <Button
                variant="secondary"
                className="h-12 w-full rounded-2xl text-sm font-black uppercase tracking-[0.22em]"
                onClick={() => requestConfirmation({
                  title: currentQuestion ? 'Move to the next question?' : gameStarted ? 'Start round one?' : 'Start live game?',
                  description: currentQuestion
                    ? 'This closes the current round and advances the board to the next ranked question.'
                    : gameStarted
                      ? 'This starts the first live round for all connected clients.'
                      : 'This starts the live game and opens round one for all connected clients.',
                  confirmLabel: currentQuestion ? 'Next question' : gameStarted ? 'Start round' : 'Start live game',
                  action: runNextQuestion,
                })}
                disabled={startLoading || nextLoading}
              >
                {startLoading || nextLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                {currentQuestion ? 'Next Question' : gameStarted ? 'Start Round' : 'Start Live Game'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        confirmLabel={confirmAction?.confirmLabel}
        confirmVariant={confirmAction?.confirmVariant}
        isLoading={loadingAction}
        onConfirm={() => void handleConfirmAction()}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      />
    </div>
  );
}
