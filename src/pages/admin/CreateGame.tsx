import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Minus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useCreateGameMutation } from '@/store/api/adminApi';
import { setAdminSession } from '@/store/slices/adminSessionSlice';
import type { AppDispatch } from '@/store';

// ── Types ──────────────────────────────────────────────────────────────────

interface QuestionDraft {
  id: number; // local UI key
  question: string;
  options: string[];
  expanded: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

let localId = 0;
function nextId() { return ++localId; }

function makeQuestion(): QuestionDraft {
  return {
    id: nextId(),
    question: '',
    options: ['', '', '', '', '', ''],
    expanded: true,
  };
}

/**
 * Admin: Create Game page.
 *
 * Allows the host to set up a game name, team names, number of rounds,
 * and add survey questions with answer options.
 *
 * On success, saves the one-time admin_code to Redux + localStorage
 * and redirects to the game lobby.
 */
export default function CreateGame() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [createGame, { isLoading }] = useCreateGameMutation();

  // ── Form state ─────────────────────────────────────────────────────────
  const [gameName, setGameName] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [numRounds, setNumRounds] = useState(3);
  const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()]);

  // ── Question helpers ───────────────────────────────────────────────────

  function addQuestion() {
    setQuestions((prev) => [...prev, makeQuestion()]);
  }

  function removeQuestion(id: number) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function toggleExpanded(id: number) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, expanded: !q.expanded } : q)),
    );
  }

  function updateQuestionText(id: number, text: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: text } : q)),
    );
  }

  function updateOption(qId: number, optIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o, i) => (i === optIndex ? value : o)) }
          : q,
      ),
    );
  }

  function addOption(qId: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length < 10
          ? { ...q, options: [...q.options, ''] }
          : q,
      ),
    );
  }

  function removeOption(qId: number, optIndex: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length > 2
          ? { ...q, options: q.options.filter((_, i) => i !== optIndex) }
          : q,
      ),
    );
  }

  // ── Validation ─────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!gameName.trim()) return 'Game name is required.';
    if (numRounds < 1 || numRounds > 20) return 'Rounds must be between 1 and 20.';
    if (questions.length === 0) return 'Add at least one question.';
    if (numRounds > questions.length)
      return `You have ${questions.length} question(s) but ${numRounds} rounds. Add more questions or reduce rounds.`;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1} text is empty.`;
      const filled = q.options.filter((o) => o.trim());
      if (filled.length < 2) return `Question ${i + 1} needs at least 2 options.`;
    }

    return null;
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const result = await createGame({
        game_name: gameName.trim(),
        team_a_name: teamAName.trim() || undefined,
        team_b_name: teamBName.trim() || undefined,
        num_rounds: numRounds,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.filter((o) => o.trim()),
        })),
      }).unwrap();

      // Save admin credentials — the admin_code is shown ONCE
      dispatch(
        setAdminSession({
          gameCode: result.game_code,
          adminCode: result.admin_code,
          gameId: result.game_id,
        }),
      );

      toast.success(`Game "${result.game_code}" created!`);
      navigate(`/admin/game/${result.game_code}/created`);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to create game.';
      toast.error(msg);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-56px)] bg-background">
      <AdminSidebar active="setup" />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto max-w-3xl px-6 py-10">

            {/* ── Heading row ── */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-primary">
                  Create New Game
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define your stadium, set the stakes.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <span className="text-xs font-bold text-primary">
                  Question {Math.min(questions.filter(q => q.expanded).length + 1, questions.length)} of {questions.length}
                </span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-primary/20">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(questions.filter(q => q.question.trim()).length / Math.max(questions.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ── GAME IDENTITY ── */}
            <section className="mb-6">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Game Identity
              </p>
              <Input
                id="gameName"
                placeholder="Enter Game Title (e.g., Office Olympics 2026)"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                maxLength={100}
                required
                className="h-14 rounded-[2rem] bg-card px-5 text-base placeholder:text-muted-foreground/60 border-0 shadow-glow focus-visible:ring-1 focus-visible:ring-primary"
              />
            </section>

            {/* ── GOAL / ROUNDS ── */}
            <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                {/* spacer to align with goal widget */}
              </div>
              <div className="w-full rounded-3xl bg-secondary p-4 text-center shadow-glow sm:w-44">
                <p className="mb-2 text-[10px] font-black tracking-widest text-secondary-foreground/60 uppercase">
                  Goal
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumRounds((n) => Math.max(1, n - 1))}
                    className="flex size-8 items-center justify-center rounded-full bg-white/20 text-secondary-foreground hover:bg-white/30 transition-colors"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-3xl font-black text-secondary-foreground">
                    {numRounds}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNumRounds((n) => Math.min(20, n + 1))}
                    className="flex size-8 items-center justify-center rounded-full bg-white/20 text-secondary-foreground hover:bg-white/30 transition-colors"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] font-black tracking-widest text-secondary-foreground/60 uppercase">
                  Rounds
                </p>
              </div>
            </section>

            {/* ── TEAM NAMES ── */}
            <section className="mb-8">
              <h2 className="mb-3 text-base font-bold text-foreground">Team Names</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { id: 'teamA', label: 'TEAM 1', value: teamAName, setter: setTeamAName, placeholder: 'Type team name here...' },
                  { id: 'teamB', label: 'TEAM 2', value: teamBName, setter: setTeamBName, placeholder: 'Type team name here...' },
                ].map(({ id, label, value, setter, placeholder }) => (
                  <div key={id} className="rounded-[2rem] bg-card p-5 shadow-glow">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                        {label}
                      </span>
                      <Pencil className="size-3 text-muted-foreground ml-2" />
                    </div>
                    <input
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      maxLength={50}
                      className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 outline-none font-bold"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ── QUESTIONS ── */}
            <section className="mb-8">
              <div className="space-y-3">
                {questions.map((q, qIndex) => {
                  const isCurrentRound = q.expanded;
                  return (
                    <div
                      key={q.id}
                      className={isCurrentRound
                        ? 'rounded-[2rem] bg-gradient-primary shadow-glow p-6 text-primary-foreground'
                        : 'rounded-[2rem] border-none bg-card shadow-glow p-6'
                      }
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-3 mb-3">
                        {isCurrentRound && (
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                            Current Round
                          </span>
                        )}
                        {!isCurrentRound && (
                          <>
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {qIndex + 1}
                            </span>
                            <button
                              type="button"
                              className="flex flex-1 items-center gap-2 text-left"
                              onClick={() => toggleExpanded(q.id)}
                            >
                              <span className="flex-1 truncate text-sm font-medium text-foreground">
                                {q.question.trim() || (
                                  <span className="text-muted-foreground">Untitled question…</span>
                                )}
                              </span>
                              <ChevronDown className="size-4 text-muted-foreground" />
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeQuestion(q.id)}
                              disabled={questions.length === 1}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                        {isCurrentRound && (
                          <button
                            type="button"
                            className="ml-auto"
                            onClick={() => toggleExpanded(q.id)}
                          >
                            <ChevronUp className="size-5 text-primary-foreground/70" />
                          </button>
                        )}
                      </div>

                      {q.expanded && (
                        <>
                          {/* Question input */}
                          <textarea
                            placeholder="Type your survey question here..."
                            value={q.question}
                            onChange={(e) => updateQuestionText(q.id, e.target.value)}
                            maxLength={500}
                            rows={2}
                            className="w-full rounded-2xl bg-white/10 px-5 py-4 text-base font-bold text-white placeholder:text-white/50 outline-none resize-none focus:bg-white/20 transition-colors"
                          />

                          {/* Answer options */}
                          <div className="mt-5">
                            <p className="mb-3 text-[10px] font-black tracking-widest text-white/70 uppercase">
                              Answer Options &amp; Point Values
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 focus-within:bg-white/20 transition-colors">
                                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-secondary-foreground shadow-sm">
                                    {i + 1}
                                  </span>
                                  <input
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(q.id, i, e.target.value)}
                                    maxLength={200}
                                    className="flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-white/50 outline-none min-w-0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOption(q.id, i)}
                                    disabled={q.options.length <= 2}
                                    className="shrink-0 text-white/40 hover:text-white disabled:opacity-30 p-1"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {q.options.length < 10 && (
                              <button
                                type="button"
                                onClick={() => addOption(q.id)}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 py-3 text-sm font-bold text-white/70 hover:border-white/40 hover:bg-white/5 transition-all"
                              >
                                <Plus className="size-4" />
                                Add Another Answer Option
                              </button>
                            )}
                          </div>

                          {/* Footer row */}
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-primary-foreground/60 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeQuestion(q.id)}
                                disabled={questions.length === 1}
                              >
                                Discard
                              </Button>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-secondary text-secondary-foreground font-black hover:bg-secondary/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 rounded-xl"
                              onClick={() => toggleExpanded(q.id)}
                            >
                              Save Question
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── QUESTION PIPELINE ── */}
            <section className="mb-10">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Question Pipeline</h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addQuestion}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Add Question
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-[2rem] bg-card p-5 text-sm shadow-glow">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                      Question {i + 1}
                    </p>
                    <p className="font-semibold text-foreground truncate">
                      {q.question.trim() || <span className="text-muted-foreground italic">Empty…</span>}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {q.options.filter(o => o.trim()).length} Answers
                    </p>
                  </div>
                ))}
                {/* Placeholder for next */}
                <div className="rounded-[2rem] border-2 border-dashed border-border p-4 text-sm text-muted-foreground/50 flex items-center justify-center min-h-25">
                  Placeholder for Next Round...
                </div>
              </div>
            </section>

            {/* ── SUBMIT ── */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-14 py-4 text-base font-black tracking-wider text-primary-foreground uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : null}
                {isLoading ? 'Creating…' : 'Launch Game Arena'}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                All set? This will finalise the setup and generate your room code.
              </p>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
