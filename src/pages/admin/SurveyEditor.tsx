import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import {
  useAddQuestionMutation,
  useAddOptionMutation,
  useGetQuestionsQuery,
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
  options: OptionDraft[];
  isNew?: boolean;
}

let localDraftId = 0;
function makeDraftOption(): OptionDraft {
  localDraftId += 1;
  return { id: `new-option-${localDraftId}`, option_text: '', isNew: true };
}

function makeDraftQuestion(): QuestionDraft {
  localDraftId += 1;
  return {
    id: `new-question-${localDraftId}`,
    question: '',
    options: [makeDraftOption(), makeDraftOption()],
    isNew: true,
  };
}

export default function SurveyEditor() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const {
    data: questionsData,
    isLoading: questionsLoading,
    refetch,
  } = useGetQuestionsQuery(gameCode);
  const [addQuestion] = useAddQuestionMutation();
  const [addOption] = useAddOptionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [updateOption] = useUpdateOptionMutation();

  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!questionsData) return;
    setDraftQuestions(
      questionsData.map((question) => ({
        id: question.id,
        question: question.question,
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

  function addQuestionDraft() {
    setDraftQuestions((prev) => [...prev, makeDraftQuestion()]);
  }

  function addOptionDraft(questionId: string) {
    setDraftQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, makeDraftOption()] }
          : question,
      ),
    );
  }

  function removeDraftOption(questionId: string, optionId: string) {
    setDraftQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.filter((option) => option.id !== optionId),
            }
          : question,
      ),
    );
  }

  function isQuestionChanged(draft: QuestionDraft): boolean {
    if (draft.isNew) return true;
    const original = originalQuestions[draft.id];
    if (!original) return true;
    if (draft.question.trim() !== original.question) return true;
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
    const filledOptions = draft.options.filter((option) => option.option_text.trim());
    if (filledOptions.length < 2) return false;
    return !draft.options.some(
      (option) => !option.option_text.trim() && !option.isNew,
    );
  }

  async function handleSaveQuestion(draft: QuestionDraft) {
    if (saving[draft.id]) return;
    if (!isQuestionValid(draft)) {
      toast.error('Question text and at least two options are required.');
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
        }).unwrap();
        toast.success('Survey question added.');
      } else {
        const original = originalQuestions[draft.id];
        if (!original) throw new Error('Original question data not found.');

        const updateCalls: Promise<unknown>[] = [];

        if (draft.question.trim() !== original.question) {
          updateCalls.push(
            updateQuestion({
              gameCode,
              questionId: draft.id,
              question: draft.question.trim(),
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

  if (questionsLoading) {
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
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                Edit Survey Questions
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-soft">
                Update question text and answer options before the game begins.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate(`/admin/game/${gameCode}`)}>
                <ArrowLeft className="size-4 mr-2" /> Back to Lobby
              </Button>
              <Button variant="default" onClick={addQuestionDraft}>
                <Plus className="size-4 mr-2" /> Add Question
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {draftQuestions.map((question, index) => {
              const original = originalQuestions[question.id];
              const changed = isQuestionChanged(question);
              const valid = isQuestionValid(question);
              return (
                <section key={question.id} className="theme-panel rounded-[1.75rem] p-6">
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
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
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <span className="text-xs text-muted-foreground">
                        {question.options.length} option{question.options.length === 1 ? '' : 's'}
                      </span>
                      <Button
                        disabled={!changed || !valid || saving[question.id]}
                        onClick={() => void handleSaveQuestion(question)}
                      >
                        {saving[question.id] ? 'Saving…' : question.isNew ? 'Save question' : 'Save changes'}
                      </Button>
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
                      variant="outline"
                      onClick={() => addOptionDraft(question.id)}
                      disabled={question.options.length >= 15}
                    >
                      <Plus className="size-4 mr-2" /> Add Answer Option
                    </Button>
                    {!valid ? (
                      <p className="text-xs text-destructive">
                        Question and at least two answer options are required.
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
