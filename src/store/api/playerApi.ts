import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '@/lib/constants';
import type {
  JoinGameResponse,
  PlayerCountResponse,
  BoardSnapshot,
  CastVotePayload,
  PublicQuestionsResponse,
} from '@/types';

/**
 * RTK Query API for player-facing (public) endpoints.
 *
 * All requests include credentials so the voter_token cookie is sent
 * automatically once set by the /join endpoint.
 */
export const playerApi = createApi({
  reducerPath: 'playerApi',

  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    // Required: sends the voter_token cookie on every player request
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),

  endpoints: (builder) => ({
    // ── GET /games/:gameCode/join ──────────────────────────────────────────
    // Sets the voter_token cookie. Recommended before voting but no longer required.
    joinGame: builder.mutation<JoinGameResponse, string>({
      query: (gameCode) => ({
        url: `/games/${gameCode}/join`,
        method: 'GET',
      }),
    }),

    // ── GET /games/:gameCode/board ─────────────────────────────────────────
    // Full board snapshot for initial load or reconnect.
    getBoard: builder.query<BoardSnapshot, string>({
      query: (gameCode) => `/games/${gameCode}/board`,
    }),

    // ── GET /games/:gameCode/players/count ─────────────────────────────────
    // Live player count shown in lobby.
    getPlayerCount: builder.query<PlayerCountResponse, string>({
      query: (gameCode) => `/games/${gameCode}/players/count`,
    }),

    // ── GET /games/:gameCode/questions ─────────────────────────────────────
    // Public questions list for the voting phase. Only succeeds when
    // voting_state is OPEN. Returns IDs to forward verbatim in cast-vote body.
    getPublicQuestions: builder.query<PublicQuestionsResponse, string>({
      query: (gameCode) => `/games/${gameCode}/questions`,
    }),

    // ── POST /games/:gameCode/vote ─────────────────────────────────────────
    // Submit one or more survey answers in a single batch. Each vote item
    // must include gameId, questionId, and up to 3 option UUIDs.
    // Rate-limited to 1 request per 10 s per IP.
    castVote: builder.mutation<
      { message: string },
      { gameCode: string; payload: CastVotePayload }
    >({
      query: ({ gameCode, payload }) => ({
        url: `/games/${gameCode}/vote`,
        method: 'POST',
        body: payload,
      }),
    }),
  }),
});

export const {
  useJoinGameMutation,
  useGetBoardQuery,
  useGetPlayerCountQuery,
  useGetPublicQuestionsQuery,
  useCastVoteMutation,
} = playerApi;
