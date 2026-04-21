import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, AlertCircle, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useGetPublicQuestionsQuery,
  useCastVoteMutation,
  useGetBoardQuery,
} from '@/store/api/playerApi';
import { useGameEvents } from '@/hooks/useGameEvents';
import { applyBoardSnapshot } from '@/store/slices/gameStateSlice';
import type { RootState, AppDispatch } from '@/store';
import { getErrorMessage } from '@/lib/utils';

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export default function VotingPage() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { playState, votingState } = useSelector((state: RootState) => state.gameState);

  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError,
  } = useGetPublicQuestionsQuery(gameCode);
  const { data: board, refetch: refetchBoard } = useGetBoardQuery(gameCode);
  const [castVote] = useCastVoteMutation();

  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shuffledQuestions = useMemo(
    () =>
      questionsData
        ? shuffleArray(questionsData.questions).map((question) => ({
            ...question,
            options: shuffleArray(question.options),
          }))
        : [],
    [questionsData],
  );

  useEffect(() => {
    if (!board) return;
    dispatch(applyBoardSnapshot(board));
  }, [board, dispatch]);

  const handleDisconnect = useCallback(async () => {
    try {
      const snapshot = await refetchBoard().unwrap();
      dispatch(applyBoardSnapshot(snapshot));
    } catch {
      // Let the SSE hook keep retrying in the background.
    }
  }, [dispatch, refetchBoard]);

  useGameEvents(gameCode, handleDisconnect);

  useEffect(() => {
    if (playState === 'IN_PROGRESS') {
      navigate(`/game/${gameCode}/board`, { replace: true });
      return;
    }

    if (playState === 'FINISHED') {
      navigate(`/game/${gameCode}/end`, { replace: true });
      return;
    }

    if (votingState === 'CLOSED') {
      navigate(`/game/${gameCode}`, { replace: true });
    }
  }, [gameCode, navigate, playState, votingState]);

  function toggleOption(questionId: string, optionId: string) {
    setSelections((prev) => {
      const current = new Set(prev[questionId] ?? []);
      if (current.has(optionId)) {
        current.delete(optionId);
      } else if (current.size < 3) {
        current.add(optionId);
      } else {
        toast.warning('You can select up to 3 options.');
        return prev;
      }
      return { ...prev, [questionId]: current };
    });
  }

  function handleSaveCurrent(questionId: string) {
    const selectedOptions = selections[questionId] ?? new Set<string>();
    if (selectedOptions.size === 0) {
      toast.error('Select at least one answer before saving.');
      return;
    }

    setSaved((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });

    if (currentIdx < (questionsData?.questions.length ?? 0) - 1) {
      setCurrentIdx((index) => index + 1);
    }
  }

  function buildVotePayload(questionIds: string[]) {
    return {
      votes: questionIds.map((questionId) => ({
        gameId: questionsData!.gameId,
        questionId,
        optionIds: Array.from(selections[questionId] ?? []),
      })),
    };
  }

  async function submitVotes(questionIds: string[]) {
    if (!questionsData || isSubmitting) return;

    const pendingQuestionIds = questionIds.filter((questionId) => !submitted.has(questionId));
    if (pendingQuestionIds.length === 0) {
      toast.error('Save at least one question before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      await castVote({
        gameCode,
        payload: buildVotePayload(pendingQuestionIds),
      }).unwrap();

      setSubmitted((prev) => {
        const next = new Set(prev);
        pendingQuestionIds.forEach((id) => next.add(id));
        return next;
      });
      setSaved((prev) => {
        const next = new Set(prev);
        pendingQuestionIds.forEach((id) => next.delete(id));
        return next;
      });

      toast.success(
        pendingQuestionIds.length === 1
          ? 'Survey answer submitted!'
          : `${pendingQuestionIds.length} saved questions submitted!`,
      );
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        toast.error('You have already voted on one or more questions.');
        setSubmitted((prev) => {
          const next = new Set(prev);
          pendingQuestionIds.forEach((id) => next.add(id));
          return next;
        });
        return;
      }

      toast.error(getErrorMessage(err, 'Could not submit vote. Try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitReadyQuestions() {
    const readyQuestionIds = questionsData?.questions
      .filter(
        (question) =>
          !submitted.has(question.questionId) &&
          saved.has(question.questionId) &&
          (selections[question.questionId]?.size ?? 0) > 0,
      )
      .map((question) => question.questionId);

    const remainingIncompleteCount = questionsData?.questions.filter(
      (question) =>
        !submitted.has(question.questionId) &&
        !(
          saved.has(question.questionId) &&
          (selections[question.questionId]?.size ?? 0) > 0
        ),
    ).length;

    if (!readyQuestionIds || readyQuestionIds.length === 0) {
      toast.error('Save one or more questions before submitting.');
      return;
    }

    if (remainingIncompleteCount && remainingIncompleteCount > 0) {
      toast.error('Answer and save all questions before submitting.');
      return;
    }

    await submitVotes(readyQuestionIds);
  }

  if (questionsLoading) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (isError || !questionsData) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <div className="text-center max-w-sm">
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
          <p className="text-lg font-bold text-foreground">Waiting for the host…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The host will open the survey soon. Stay tuned!
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate(`/game/${gameCode}/board`)}
          >
            Watch Live Board
          </Button>
        </div>
      </main>
    );
  }

  const questions = shuffledQuestions;
  const readyQuestionIds = questions
    .filter(
      (question) =>
        !submitted.has(question.questionId) &&
        saved.has(question.questionId) &&
        (selections[question.questionId]?.size ?? 0) > 0,
    )
    .map((question) => question.questionId);

  const allQuestionsAnswered = questions.every(
    (question) =>
      submitted.has(question.questionId) ||
      (saved.has(question.questionId) && (selections[question.questionId]?.size ?? 0) > 0),
  );

  const canSubmitAll = allQuestionsAnswered && readyQuestionIds.length > 0;

  if (questions.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">No questions available.</p>
        </div>
      </main>
    );
  }

  const safeCurrentIdx = Math.min(currentIdx, questions.length - 1);
  const currentQuestion = questions[safeCurrentIdx];
  const selected = selections[currentQuestion.questionId] ?? new Set<string>();
  const isSaved = saved.has(currentQuestion.questionId);
  const isSubmitted = submitted.has(currentQuestion.questionId);
  const allDone = questions.every((q) => submitted.has(q.questionId));

  if (allDone) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="mx-auto mb-4 size-14 text-primary" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">All votes submitted!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wait for the host to start the live game.
          </p>
          <Button className="mt-6" onClick={() => navigate(`/game/${gameCode}/board`)}>
            Watch Live Board
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-background">
      <div className="px-4 pt-6 pb-2 text-center">
        <p className="text-sm font-bold text-accent sm:text-[0.95rem]">
          Pick up to 3 answers for this question.
        </p>
      </div>

      <div className="mx-auto max-w-md px-4 pb-10 sm:max-w-lg">
        <div className="theme-panel rounded-[1.75rem] p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Question {String(safeCurrentIdx + 1).padStart(2, "0")}
              </p>
              <h2 className="text-xl leading-tight font-black tracking-tight text-foreground sm:text-2xl">
                &ldquo;
                {
                  // currentQuestion.question.length > 40
                  //   ? currentQuestion.question.slice(0, 40) + '...'
                  //   :
                  currentQuestion.question
                }
                &rdquo;
              </h2>
            </div>
            <span className="ml-4 shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
              {safeCurrentIdx + 1} / {questions.length}
            </span>
          </div>

          {/* <p className="mb-4 rounded-xl bg-background/70 px-4 py-3 text-sm italic text-soft">
            &ldquo;{currentQuestion.question}&rdquo;
          </p> */}

          <div className="max-h-78 space-y-2 overflow-y-auto pr-1">
            {currentQuestion.options.map((opt) => {
              const isSelected = selected.has(opt.optionId)
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() =>
                    toggleOption(currentQuestion.questionId, opt.optionId)
                  }
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all sm:px-5 ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background/80 text-foreground hover:border-primary/50 hover:bg-primary/5"
                  } disabled:opacity-60`}
                >
                  <span>{opt.text}</span>
                  {isSelected && (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {!isSubmitted ? (
            <div className="mt-4 space-y-3">
              <div className="text-soft rounded-2xl bg-background/70 px-4 py-3 text-xs">
                Save marks this question as ready for the single submit action
                below.
              </div>
              <button
                type="button"
                onClick={() => handleSaveCurrent(currentQuestion.questionId)}
                disabled={isSubmitted || selected.size === 0}
                className="w-full rounded-3xl border border-border bg-background px-4 py-3.5 text-sm font-black tracking-wider text-foreground uppercase transition hover:border-primary/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaved
                  ? "Saved"
                  : safeCurrentIdx < questions.length - 1
                    ? "Save & next"
                    : "Save"}
              </button>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-3xl bg-green-100 py-3 text-sm font-bold text-green-700">
              <CheckCircle2 className="size-5" />
              Vote submitted!
            </div>
          )}
        </div>

        {questions.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.questionId}
                type="button"
                onClick={() => setCurrentIdx(i)}
                className={`size-2 rounded-full transition-all ${
                  i === safeCurrentIdx
                    ? "w-4 bg-primary"
                    : submitted.has(q.questionId)
                      ? "bg-green-500/70"
                      : saved.has(q.questionId)
                        ? "bg-accent/70"
                        : "bg-border/30"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button
            className="h-10 w-full text-sm"
            disabled={!canSubmitAll || isSubmitting}
            onClick={handleSubmitReadyQuestions}
          >
            {isSubmitting
              ? "Submitting..."
              : `Submit ${readyQuestionIds.length} saved ${readyQuestionIds.length === 1 ? "question" : "questions"}`}
          </Button>
          {!canSubmitAll && (
            <p className="mt-2 text-xs text-muted-foreground">
              Answer and save every question before submitting.
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="theme-panel flex-col items-center rounded-3xl p-4 text-center">
            <Trophy className="mb-2 size-6 w-full text-accent" />
            <p className="text-xs font-black text-foreground">Top Points</p>
            <p className="text-faint text-[10px]">
              Popular answers earn more points when the host reveals them on the
              board.
            </p>
          </div>
          <div className="theme-panel flex-col justify-items-center rounded-3xl p-4 text-center">
            <Zap className="mb-2 size-6 w-full text-accent" />
            <p className="text-xs font-black text-foreground">One Submit</p>
            <p className="text-faint text-[10px]">
              Save each question first, then send every saved answer together in
              one go.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}


