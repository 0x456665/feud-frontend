import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Loader2, Plus, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import {
  useAddOptionMutation,
  useAddQuestionMutation,
  useGetGameQuery,
  useGetQuestionsQuery,
  useUpdateGameMutation,
  useUpdateOptionMutation,
  useUpdateQuestionMutation,
} from '@/store/api/adminApi';
import { getErrorMessage } from '@/lib/utils';
import type { Question } from '@/types';

interface OptionDraft {
  id: string;
  option_text: string;
  isNew?: boolean;
}

interface QuestionDraft {
  id: string;
  question: string;
  number_of_options: number;
  options: OptionDraft[];
  isNew?: boolean;
}

const MAX_QUESTION_OPTIONS = 15;

let localDraftId = 0;

function makeDraftOption(text = ''): OptionDraft {
  localDraftId += 1;
  return {
    id: `new-option-${localDraftId}`,
    option_text: text,
    isNew: true,
  };
}

function clampTopAnswerCount(value: number, optionCount: number): number {
  return Math.max(2, Math.min(MAX_QUESTION_OPTIONS, Math.min(optionCount, value)));
}

function makeDraftQuestion(template?: {
  question?: string;
  number_of_options?: number;
  options?: string[];
}): QuestionDraft {
  localDraftId += 1;

  const optionDrafts = template?.options?.length
    ? template.options.map((optionText) => makeDraftOption(optionText))
    : [makeDraftOption(), makeDraftOption()];

  return {
    id: `new-question-${localDraftId}`,
    question: template?.question ?? '',
    number_of_options: clampTopAnswerCount(
      template?.number_of_options ?? Math.min(6, optionDrafts.length),
      optionDrafts.length,
    ),
    options: optionDrafts,
    isNew: true,
  };
}

export default function SurveyEditor() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const { data: game, isLoading: gameLoading } = useGetGameQuery(gameCode);
  const {
    data: questionsData,
    isLoading: questionsLoading,
    refetch,
  } = useGetQuestionsQuery(gameCode);
  const [updateGame] = useUpdateGameMutation();
  const [addQuestion] = useAddQuestionMutation();
  const [addOption] = useAddOptionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [updateOption] = useUpdateOptionMutation();

  const [gameName, setGameName] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savingGameDetails, setSavingGameDetails] = useState(false);

  useEffect(() => {
    if (!game) return;
    setGameName(game.game_name);
    setTeamAName(game.team_a_name);
    setTeamBName(game.team_b_name);
  }, [game]);

  useEffect(() => {
    if (!questionsData) return;
    setDraftQuestions(
      questionsData.map((question) => ({
        id: question.id,
        question: question.question,
        number_of_options: question.number_of_options,
        options: question.options.map((option) => ({
          id: option.id,
          option_text: option.option_text,
        })),
      })),
    );
  }, [questionsData]);

  const originalQuestions = useMemo(
    () =>
      questionsData?.reduce<Record<string, Question>>((acc, question) => {
        acc[question.id] = question;
        return acc;
      }, {}) ?? {},
    [questionsData],
  );

  const gameDetailsChanged = !!game && (
    gameName.trim() !== game.game_name ||
    teamAName.trim() !== game.team_a_name ||
    teamBName.trim() !== game.team_b_name
  );

  function updateQuestionText(questionId: string, value: string) {
    setDraftQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, question: value } : question,
      ),
    );
  }

  function updateOptionText(questionId: string, optionId: string, value: string) {
    setDraftQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, option_text: value } : option,
              ),
            }
          : question,
      ),
    );
  }

  function updateTopAnswerCount(questionId: string, value: string) {
    const parsedValue = Number.parseInt(value, 10);
    if (Number.isNaN(parsedValue)) return;

    setDraftQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              number_of_options: clampTopAnswerCount(
                parsedValue,
                Math.max(question.options.length, 2),
              ),
            }
          : question,
      ),
    );
  }

  function addQuestionDraft() {
    setDraftQuestions((prev) => [...prev, makeDraftQuestion()]);
  }

  function duplicateQuestionDraft(questionId: string) {
    setDraftQuestions((prev) => {
      const sourceIndex = prev.findIndex((question) => question.id === questionId);
      if (sourceIndex === -1) return prev;

      const source = prev[sourceIndex];
      const duplicate = makeDraftQuestion({
        question: source.question.trim() ? `${source.question.trim()} (Copy)` : '',
        number_of_options: source.number_of_options,
        options: source.options.map((option) => option.option_text),
      });

      return [
        ...prev.slice(0, sourceIndex + 1),
        duplicate,
        ...prev.slice(sourceIndex + 1),
      ];
    });
  }

  function addOptionDraft(questionId: string) {
    setDraftQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: [...question.options, makeDraftOption()],
            }
          : question,
      ),
    );
  }

  function removeDraftOption(questionId: string, optionId: string) {
    setDraftQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;

        const nextOptions = question.options.filter((option) => option.id !== optionId);

        return {
          ...question,
          options: nextOptions,
          number_of_options: clampTopAnswerCount(
            question.number_of_options,
            Math.max(nextOptions.length, 2),
          ),
        };
      }),
    );
  }

  function getFilledOptionCount(draft: QuestionDraft): number {
    return draft.options.filter((option) => option.option_text.trim()).length;
  }

  function isQuestionChanged(draft: QuestionDraft): boolean {
    if (draft.isNew) return true;
    const original = originalQuestions[draft.id];
    if (!original) return true;
    if (draft.question.trim() !== original.question) return true;
    if (draft.number_of_options !== original.number_of_options) return true;
    if (draft.options.length !== original.options.length) return true;

    for (const option of draft.options) {
      const originalOption = original.options.find((candidate) => candidate.id === option.id);
      if (!originalOption) return true;
      if (option.option_text.trim() !== originalOption.option_text) return true;
    }

    return false;
  }

  function isQuestionValid(draft: QuestionDraft): boolean {
    if (!draft.question.trim()) return false;

    const filledOptions = getFilledOptionCount(draft);
    if (filledOptions < 2) return false;
    if (draft.number_of_options > filledOptions) return false;

    return !draft.options.some((option) => !option.option_text.trim() && !option.isNew);
  }

  async function handleSaveGameDetails() {
    if (!gameDetailsChanged || savingGameDetails) return;

    setSavingGameDetails(true);
    try {
      await updateGame({
        gameCode,
        updates: {
          game_name: gameName.trim(),
          team_a_name: teamAName.trim(),
          team_b_name: teamBName.trim(),
        },
      }).unwrap();
      toast.success('Game details updated.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Unable to update game details.'));
    } finally {
      setSavingGameDetails(false);
    }
  }

  async function handleSaveQuestion(draft: QuestionDraft) {
    if (saving[draft.id]) return;
    if (!isQuestionValid(draft)) {
      toast.error('Question text, valid top-answer count, and at least two options are required.');
      return;
    }

    setSaving((prev) => ({ ...prev, [draft.id]: true }));

    try {
      if (draft.isNew) {
        const newOptions = draft.options
          .map((option) => option.option_text.trim())
          .filter(Boolean);

        await addQuestion({
          gameCode,
          question: draft.question.trim(),
          options: newOptions,
          number_of_options: draft.number_of_options,
        }).unwrap();
        toast.success('Survey question added.');
      } else {
        const original = originalQuestions[draft.id];
        if (!original) throw new Error('Original question data not found.');

        const updateCalls: Promise<unknown>[] = [];

        if (
          draft.question.trim() !== original.question ||
          draft.number_of_options !== original.number_of_options
        ) {
          updateCalls.push(
            updateQuestion({
              gameCode,
              questionId: draft.id,
              question: draft.question.trim(),
              number_of_options: draft.number_of_options,
            }).unwrap(),
          );
        }

        for (const option of draft.options) {
          const trimmedText = option.option_text.trim();
          const originalOption = original.options.find((item) => item.id === option.id);

          if (!originalOption && option.isNew && trimmedText) {
            updateCalls.push(
              addOption({
                gameCode,
                questionId: draft.id,
                option_text: trimmedText,
              }).unwrap(),
            );
          }

          if (originalOption && trimmedText !== originalOption.option_text) {
            updateCalls.push(
              updateOption({
                gameCode,
                questionId: draft.id,
                optionId: option.id,
                option_text: trimmedText,
              }).unwrap(),
            );
          }
        }

        if (updateCalls.length === 0) {
          toast.success('No changes to save.');
        } else {
          await Promise.all(updateCalls);
          toast.success('Question updated.');
        }
      }

      await refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Unable to save survey question.'));
    } finally {
      setSaving((prev) => ({ ...prev, [draft.id]: false }));
    }
  }

  if (questionsLoading || gameLoading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] bg-background">
      <AdminSidebar gameCode={gameCode} active="survey" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                Edit Survey Questions
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-soft">
                Update game details, duplicate strong questions, and control how many top answers reach the board.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/admin/game/${gameCode}`)}
              >
                <ArrowLeft className="mr-2 size-4" /> Back to Lobby
              </Button>
              <Button type="button" variant="default" onClick={addQuestionDraft}>
                <Plus className="mr-2 size-4" /> Add Question
              </Button>
            </div>
          </div>

          <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="theme-panel rounded-[1.9rem] p-6">
              <div className="mb-5 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <p className="text-sm font-black text-foreground">Game Identity</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Game Name
                  </label>
                  <Input value={gameName} onChange={(e) => setGameName(e.target.value)} maxLength={100} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Team A
                  </label>
                  <Input value={teamAName} onChange={(e) => setTeamAName(e.target.value)} maxLength={50} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Team B
                  </label>
                  <Input value={teamBName} onChange={(e) => setTeamBName(e.target.value)} maxLength={50} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={!gameDetailsChanged || savingGameDetails}
                  onClick={() => void handleSaveGameDetails()}
                >
                  <Save className="mr-2 size-4" />
                  {savingGameDetails ? 'Saving…' : 'Save names'}
                </Button>
                {!gameDetailsChanged ? (
                  <p className="text-xs text-muted-foreground">No unsaved game detail changes.</p>
                ) : null}
              </div>
            </div>

            <div className="theme-panel rounded-[1.9rem] p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Board Rules
              </p>
              <h2 className="mt-3 text-xl font-black text-foreground">Top-answer control</h2>
              <p className="mt-2 text-sm leading-6 text-soft">
                Each question can define how many ranked answers appear on the board. The count cannot exceed the number of filled options.
              </p>
              <div className="mt-5 rounded-[1.5rem] bg-background/80 p-4 text-sm text-foreground/80">
                Duplicate a question to keep the wording and answer set, then tune the copy without retyping every option.
              </div>
            </div>
          </section>

          <div className="space-y-6">
            {draftQuestions.map((question, index) => {
              const original = originalQuestions[question.id];
              const changed = isQuestionChanged(question);
              const valid = isQuestionValid(question);
              const filledOptionCount = getFilledOptionCount(question);

              return (
                <section key={question.id} className="theme-panel rounded-[1.75rem] p-6">
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                        Question {index + 1}
                      </p>
                      <Textarea
                        rows={4}
                        className="min-h-20 w-full"
                        value={question.question}
                        onChange={(e) => updateQuestionText(question.id, e.target.value)}
                        placeholder="Type your survey question here..."
                      />
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-3 sm:min-w-52 sm:items-end">
                      <div className="rounded-[1.25rem] bg-background/80 px-4 py-3 text-left sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                          Top Answers On Board
                        </p>
                        <div className="mt-2 flex items-center gap-3 sm:justify-end">
                          <Input
                            type="number"
                            min={2}
                            max={Math.max(question.options.length, 2)}
                            value={question.number_of_options}
                            onChange={(e) => updateTopAnswerCount(question.id, e.target.value)}
                            className="h-9 w-20 text-center"
                          />
                          <span className="text-xs text-muted-foreground">
                            max {filledOptionCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => duplicateQuestionDraft(question.id)}>
                          <Copy className="mr-2 size-4" /> Duplicate
                        </Button>
                        <Button
                          type="button"
                          disabled={!changed || !valid || saving[question.id]}
                          onClick={() => void handleSaveQuestion(question)}
                        >
                          {saving[question.id] ? 'Saving…' : question.isNew ? 'Save question' : 'Save changes'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id} className="flex items-center gap-3">
                        <span className="min-w-8 text-sm font-black text-muted-foreground">
                          {optionIndex + 1}.
                        </span>
                        <Input
                          className="flex-1"
                          value={option.option_text}
                          onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        {option.isNew ? (
                          <button
                            type="button"
                            onClick={() => removeDraftOption(question.id, option.id)}
                            className="rounded-full border border-border bg-background px-3 py-2 text-xs font-bold uppercase text-destructive transition hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOptionDraft(question.id)}
                      disabled={question.options.length >= MAX_QUESTION_OPTIONS}
                    >
                      <Plus className="mr-2 size-4" /> Add Answer Option
                    </Button>
                    {!valid ? (
                      <p className="text-xs text-destructive">
                        Each question needs text, at least two filled answers, and a top-answer count that does not exceed the filled options.
                      </p>
                    ) : original && !changed ? (
                      <p className="text-xs text-muted-foreground">No unsaved changes.</p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
