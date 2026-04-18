import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';
import { BASE_URL } from '@/lib/constants';
import type {
  Game,
  GameplayLog,
  BoardSnapshot,
  SurveyQuestionStat,
  CreateGamePayload,
  CreateGameResponse,
  VotingState,
  Team,
  EndGameResult,
  Question,
  Option,
  SurveyVoterCountResponse,
} from '@/types';

/**
 * RTK Query API for admin-only endpoints.
 *
 * Every request automatically injects the X-Admin-Code header from the
 * Redux store (adminSession.adminCode).  The game creation route is the
 * only exception — it doesn't need an admin code yet (the game doesn't
 * exist) and is handled by a separate base-query without the header.
 */
export const adminApi = createApi({
  reducerPath: 'adminApi',

  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const adminCode = state.adminSession.adminCode;

      headers.set('Content-Type', 'application/json');

      // Inject admin code on every request when available
      if (adminCode) {
        headers.set('X-Admin-Code', adminCode);
      }

      return headers;
    },
  }),

  // Tag types used for cache invalidation
  tagTypes: ['Game', 'SurveyStats', 'Questions'],

  endpoints: (builder) => ({
    // ── POST /admin/games ──────────────────────────────────────────────────
    // Creates a new game. Does NOT require X-Admin-Code.
    // The response includes admin_code which must be saved — shown ONCE.
    createGame: builder.mutation<CreateGameResponse, CreateGamePayload>({
      query: (payload) => ({
        url: '/admin/games',
        method: 'POST',
        body: payload,
      }),
    }),

    // ── GET /admin/games/:gameCode ─────────────────────────────────────────
    // Full game detail including all questions and options.
    getGame: builder.query<Game, string>({
      query: (gameCode) => `/admin/games/${gameCode}`,
      providesTags: (_result, _error, gameCode) => [{ type: 'Game', id: gameCode }],
    }),

    // ── GET /admin/games/:gameCode/survey-stats ────────────────────────────
    // Questions sorted by std_dev asc (best questions first).
    getSurveyStats: builder.query<SurveyQuestionStat[], string>({
      query: (gameCode) => `/admin/games/${gameCode}/survey-stats`,
      providesTags: (_result, _error, gameCode) => [{ type: 'SurveyStats', id: gameCode }],
    }),

    getSurveyVoterCount: builder.query<SurveyVoterCountResponse, string>({
      query: (gameCode) => `/admin/games/${gameCode}/survey-voters`,
    }),

    // ── PATCH /admin/games/:gameCode/voting ────────────────────────────────
    // Change voting_state: 'OPEN' | 'PAUSED' | 'CLOSED'.
    // Closing triggers std_dev / rank / points computation.
    setVotingState: builder.mutation<
      Game,
      { gameCode: string; voting_state: VotingState }
    >({
      query: ({ gameCode, voting_state }) => ({
        url: `/admin/games/${gameCode}/voting`,
        method: 'PATCH',
        body: { voting_state },
      }),
      invalidatesTags: (_result, _error, { gameCode }) => [
        { type: 'Game', id: gameCode },
        { type: 'SurveyStats', id: gameCode },
      ],
    }),

    // ── POST /admin/games/:gameCode/start ──────────────────────────────────
    // Requires voting_state=CLOSED and play_state=LOBBY.
    // Selects top num_rounds questions by std_dev asc.
    startGame: builder.mutation<Game, string>({
      query: (gameCode) => ({
        url: `/admin/games/${gameCode}/start`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, gameCode) => [{ type: 'Game', id: gameCode }],
    }),

    // ── POST /admin/games/:gameCode/next-question ──────────────────────────
    // Advance to next round. Resets revealed options and strikes.
    nextQuestion: builder.mutation<GameplayLog, string>({
      query: (gameCode) => ({
        url: `/admin/games/${gameCode}/next-question`,
        method: 'POST',
      }),
    }),

    // ── POST /admin/games/:gameCode/reveal-option ──────────────────────────
    // Reveal a specific answer tile by its option UUID.
    revealOption: builder.mutation<null, { gameCode: string; optionId: string }>({
      query: ({ gameCode, optionId }) => ({
        url: `/admin/games/${gameCode}/reveal-option`,
        method: 'POST',
        body: { optionId },
      }),
    }),

    // ── POST /admin/games/:gameCode/wrong-answer ───────────────────────────
    // Record a strike against a team.
    wrongAnswer: builder.mutation<null, { gameCode: string; team: Team }>({
      query: ({ gameCode, team }) => ({
        url: `/admin/games/${gameCode}/wrong-answer`,
        method: 'POST',
        body: { team },
      }),
    }),

    // ── POST /admin/games/:gameCode/add-score ──────────────────────────────
    // Award points to a team. Points must be ≥ 1.
    addScore: builder.mutation<
      GameplayLog,
      { gameCode: string; team: Team; points: number }
    >({
      query: ({ gameCode, team, points }) => ({
        url: `/admin/games/${gameCode}/add-score`,
        method: 'POST',
        body: { team, points },
      }),
    }),

    // ── POST /admin/games/:gameCode/end-game ───────────────────────────────
    // Ends the game. Broadcasts play_winner_sound then end_game SSE.
    endGame: builder.mutation<EndGameResult, string>({
      query: (gameCode) => ({
        url: `/admin/games/${gameCode}/end-game`,
        method: 'POST',
      }),
    }),

    // ── GET /admin/games/:gameCode/log ─────────────────────────────────────
    // Admin reconnect snapshot (same shape as /board).
    getAdminLog: builder.query<BoardSnapshot, string>({
      query: (gameCode) => `/admin/games/${gameCode}/log`,
    }),

    // ── GET /admin/games/:gameCode/questions ───────────────────────────────
    getQuestions: builder.query<Question[], string>({
      query: (gameCode) => `/admin/games/${gameCode}/questions`,
      providesTags: (_result, _error, gameCode) => [{ type: 'Questions', id: gameCode }],
    }),

    addQuestion: builder.mutation<
      Question,
      { gameCode: string; question: string; options: string[]; number_of_options?: number }
    >({
      query: ({ gameCode, question, options, number_of_options }) => ({
        url: `/admin/games/${gameCode}/questions`,
        method: 'POST',
        body: { question, options, number_of_options },
      }),
      invalidatesTags: (_result, _error, { gameCode }) => [
        { type: 'Game', id: gameCode },
        { type: 'Questions', id: gameCode },
      ],
    }),

    addOption: builder.mutation<
      Option,
      { gameCode: string; questionId: string; option_text: string }
    >({
      query: ({ gameCode, questionId, option_text }) => ({
        url: `/admin/games/${gameCode}/questions/${questionId}/options`,
        method: 'POST',
        body: { option_text },
      }),
      invalidatesTags: (_result, _error, { gameCode }) => [
        { type: 'Game', id: gameCode },
        { type: 'Questions', id: gameCode },
      ],
    }),

    updateQuestion: builder.mutation<
      Question,
      { gameCode: string; questionId: string; question?: string; number_of_options?: number }
    >({
      query: ({ gameCode, questionId, question, number_of_options }) => ({
        url: `/admin/games/${gameCode}/questions/${questionId}`,
        method: 'PATCH',
        body: { question, number_of_options },
      }),
      invalidatesTags: (_result, _error, { gameCode }) => [
        { type: 'Game', id: gameCode },
        { type: 'Questions', id: gameCode },
      ],
    }),

    updateOption: builder.mutation<
      Option,
      { gameCode: string; questionId: string; optionId: string; option_text: string }
    >({
      query: ({ gameCode, questionId, optionId, option_text }) => ({
        url: `/admin/games/${gameCode}/questions/${questionId}/options/${optionId}`,
        method: 'PATCH',
        body: { option_text },
      }),
      invalidatesTags: (_result, _error, { gameCode }) => [
        { type: 'Game', id: gameCode },
        { type: 'Questions', id: gameCode },
      ],
    }),

    // ── POST /admin/games/:gameCode/questions/import ───────────────────────
    // Batch import questions. Atomic — all succeed or all fail.
    importQuestions: builder.mutation<
      { imported: number; questions: Question[] },
      { gameCode: string; questions: Array<{ question: string; options: string[] }> }
    >({
      query: ({ gameCode, questions }) => ({
        url: `/admin/games/${gameCode}/questions/import`,
        method: 'POST',
        body: { questions },
      }),
      invalidatesTags: (_result, _error, { gameCode }) => [
        { type: 'Game', id: gameCode },
        { type: 'Questions', id: gameCode },
      ],
    }),
  }),
});

export const {
  useCreateGameMutation,
  useGetGameQuery,
  useLazyGetGameQuery,
  useGetSurveyStatsQuery,
  useGetSurveyVoterCountQuery,
  useSetVotingStateMutation,
  useStartGameMutation,
  useNextQuestionMutation,
  useRevealOptionMutation,
  useWrongAnswerMutation,
  useAddScoreMutation,
  useEndGameMutation,
  useGetAdminLogQuery,
  useGetQuestionsQuery,
  useAddQuestionMutation,
  useAddOptionMutation,
  useUpdateQuestionMutation,
  useUpdateOptionMutation,
  useImportQuestionsMutation,
} = adminApi;
