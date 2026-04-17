import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useGetPublicQuestionsQuery,
  useCastVoteMutation,
} from '@/store/api/playerApi';
import type { PublicQuestion } from '@/types';

export default function VotingPage() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();

  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError,
  } = useGetPublicQuestionsQuery(gameCode);
  const [castVote] = useCastVoteMutation();

  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  function toggleOption(questionId: string, optionId: string) {
    setSelections((prev) => {
      const current = new Set(prev[questionId] ?? []);
      if (current.has(optionId)) {
        current.delete(optionId);
      } else if (current.size < 6) {
        current.add(optionId);
      } else {
        toast.warning('You can select up to 6 options.');
        return prev;
      }
      return { ...prev, [questionId]: current };
    });
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
    if (!questionsData) return;
    const validQuestionIds = questionIds.filter(
      (questionId) => (selections[questionId]?.size ?? 0) >= 4,
    );
    if (validQuestionIds.length === 0) {
      toast.error('Select at least 4 options for each question before submitting.');
      return;
    }

    try {
      await castVote({
        gameCode,
        payload: buildVotePayload(validQuestionIds),
      }).unwrap();

      setSubmitted((prev) => {
        const next = new Set(prev);
        validQuestionIds.forEach((id) => next.add(id));
        return next;
      });

      toast.success(
        validQuestionIds.length === 1
          ? 'Vote submitted!'
          : `${validQuestionIds.length} questions submitted!`,
      );
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        toast.error('You have already voted on one or more questions.');
        setSubmitted((prev) => {
          const next = new Set(prev);
          validQuestionIds.forEach((id) => next.add(id));
          return next;
        });
        return;
      }

      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not submit vote. Try again.';
      toast.error(msg);
    }
  }

  async function handleSubmitCurrent(question: PublicQuestion) {
    await submitVotes([question.questionId]);
    if (currentIdx < (questionsData?.questions.length ?? 0) - 1) {
      setCurrentIdx((i) => i + 1);
    }
  }

  async function handleSubmitReadyQuestions() {
    const readyQuestionIds = questionsData?.questions
      .filter(
        (question) =>
          !submitted.has(question.questionId) &&
          (selections[question.questionId]?.size ?? 0) >= 4,
      )
      .map((question) => question.questionId);

    if (!readyQuestionIds || readyQuestionIds.length === 0) {
      toast.error('Select at least 4 options for one or more questions first.');
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

  const questions = questionsData.questions;
  const readyQuestionIds = questions
    .filter(
      (question) =>
        !submitted.has(question.questionId) &&
        (selections[question.questionId]?.size ?? 0) >= 4,
    )
    .map((question) => question.questionId);

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

  const currentQuestion = questions[currentIdx];
  const selected = selections[currentQuestion.questionId] ?? new Set<string>();
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
      <div className="pt-8 pb-2 text-center">
        <p className="text-sm font-bold text-accent">
          Pick between 4 and 6 answers for this question
        </p>
      </div>

      <div className="mx-auto max-w-md px-4 pb-10">
        <div className="rounded-[2rem] bg-card p-6 shadow-glow">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">
                Round {String(currentIdx + 1).padStart(2, '0')}
              </p>
              <h2 className="text-2xl font-black tracking-tight text-foreground leading-tight">
                {currentQuestion.question.length > 40
                  ? currentQuestion.question.slice(0, 40) + '...'
                  : currentQuestion.question}
              </h2>
            </div>
            <span className="ml-4 shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
              {currentIdx + 1} / {questions.length}
            </span>
          </div>

          <p className="mb-5 rounded-xl bg-background/60 px-4 py-3 text-sm italic text-muted-foreground">
            &ldquo;{currentQuestion.question}&rdquo;
          </p>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {currentQuestion.options.map((opt) => {
              const isSelected = selected.has(opt.optionId);
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => toggleOption(currentQuestion.questionId, opt.optionId)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-sm font-semibold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background/80 text-foreground hover:border-primary/50 hover:bg-primary/5'
                  } disabled:opacity-60`}
                >
                  <span>{opt.text}</span>
                  {isSelected && (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {!isSubmitted ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr]">
              <button
                type="button"
                onClick={() => {
                  if (currentIdx < questions.length - 1) {
                    setCurrentIdx((i) => i + 1);
                  }
                }}
                className="rounded-3xl border border-border bg-background px-4 py-4 text-sm font-black uppercase tracking-wider text-foreground transition hover:border-primary/70"
              >
                {currentIdx < questions.length - 1 ? 'Save & next' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmitCurrent(currentQuestion)}
                disabled={selected.size < 4}
                className="rounded-3xl gradient-primary py-4 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
              >
                Submit now
              </button>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-3xl bg-green-100 py-4 text-sm font-bold text-green-700">
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
                  i === currentIdx ? 'bg-primary w-4' : submitted.has(q.questionId) ? 'bg-primary/40' : 'bg-border/30'
                }`}
              />
            ))}
          </div>
        )}

        {readyQuestionIds.length > 0 && (
          <div className="mt-4">
            <Button className="w-full" onClick={handleSubmitReadyQuestions}>
              Submit {readyQuestionIds.length} ready {readyQuestionIds.length === 1 ? 'question' : 'questions'}
            </Button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-card p-4 shadow-glow">
            <Trophy className="mb-2 size-6 text-accent" />
            <p className="text-xs font-black text-foreground">Top Points</p>
            <p className="text-[10px] text-muted-foreground">Popular answers earn more points when the host reveals them on the board.</p>
          </div>
          <div className="rounded-3xl bg-card p-4 shadow-glow">
            <Zap className="mb-2 size-6 text-accent" />
            <p className="text-xs font-black text-foreground">Batch Submit</p>
            <p className="text-[10px] text-muted-foreground">Submit every ready question in one request instead of sending them one by one.</p>
          </div>
        </div>
      </div>
    </main>
  );
}


