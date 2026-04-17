import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  LiveGameState,
  SSEGameStatePayload,
  SSENextQuestionPayload,
  SSERevealOptionPayload,
  SSEWrongOptionPayload,
  SSEAddScorePayload,
  SSEEndGamePayload,
  BoardSnapshot,
} from '@/types';

/**
 * Tracks all live game state driven by SSE events and board snapshots.
 *
 * This slice is populated by:
 *   1. The initial GET /board (or /log) snapshot on connect/reconnect
 *   2. Incoming SSE events during live play
 */

const initialState: LiveGameState = {
  playState: null,
  votingState: null,
  teamAName: 'Team A',
  teamBName: 'Team B',
  teamAScore: 0,
  teamBScore: 0,
  currentQuestion: null,
  revealedTiles: [],
  currentStrikes: 0,
  winner: null,
};

export const gameStateSlice = createSlice({
  name: 'gameState',
  initialState,

  reducers: {
    // ── Board snapshot (initial load / reconnect) ──────────────────────────
    // Restores scores, strikes and revealed tiles from the server snapshot.
    applyBoardSnapshot(state, action: PayloadAction<BoardSnapshot>) {
      const snapshot = action.payload;
      state.playState = snapshot.play_state;
      state.votingState = snapshot.voting_state;
      state.teamAName = snapshot.team_a_name;
      state.teamBName = snapshot.team_b_name;
      state.teamAScore = snapshot.team_a_score;
      state.teamBScore = snapshot.team_b_score;
      state.currentStrikes = snapshot.current_strikes;
      state.currentQuestion = snapshot.current_question
        ? {
            id: snapshot.current_question.id,
            text: snapshot.current_question.question_text,
            totalOptions: snapshot.current_question.total_options,
            roundNumber: snapshot.current_question.round_number,
          }
        : null;
      state.revealedTiles = snapshot.revealed_options.map((option) => ({
        optionId: option.option_id,
        optionText: option.option_text,
        votes: option.votes,
        rank: option.rank,
        points: option.points,
      }));
      state.winner = snapshot.winner
        ? {
            team: snapshot.winner.winning_team,
            teamName: snapshot.winner.team_name,
            teamATotal: snapshot.winner.team_a_total,
            teamBTotal: snapshot.winner.team_b_total,
            teamAName: snapshot.winner.team_a_name,
            teamBName: snapshot.winner.team_b_name,
          }
        : null;
    },

    // ── SSE: game_state ────────────────────────────────────────────────────
    applyGameState(state, action: PayloadAction<SSEGameStatePayload>) {
      state.playState = action.payload.playState;
      state.votingState = action.payload.votingState;
    },

    // ── SSE: next_question ─────────────────────────────────────────────────
    applyNextQuestion(state, action: PayloadAction<SSENextQuestionPayload>) {
      const { questionId, questionText, totalOptions, roundNumber } = action.payload;
      state.currentQuestion = { id: questionId, text: questionText, totalOptions, roundNumber };
      state.revealedTiles = []; // new round — clear previous tiles
      state.currentStrikes = 0;
    },

    // ── SSE: reveal_option ─────────────────────────────────────────────────
    applyRevealOption(state, action: PayloadAction<SSERevealOptionPayload>) {
      const { optionId, optionText, votes, rank, points } = action.payload;
      // Avoid duplicates (e.g. if we reconnect and replay events)
      const alreadyRevealed = state.revealedTiles.some((t) => t.optionId === optionId);
      if (!alreadyRevealed) {
        state.revealedTiles.push({ optionId, optionText, votes, rank, points });
      }
    },

    // ── SSE: wrong_option ──────────────────────────────────────────────────
    applyWrongOption(state, action: PayloadAction<SSEWrongOptionPayload>) {
      state.currentStrikes = action.payload.strikeCount;
    },

    // ── SSE: add_score ─────────────────────────────────────────────────────
    // Use the authoritative totals from the server payload
    applyAddScore(state, action: PayloadAction<SSEAddScorePayload>) {
      state.teamAScore = action.payload.teamATotal;
      state.teamBScore = action.payload.teamBTotal;
      // Update team names in case they were just set
      state.teamAName = action.payload.teamAName;
      state.teamBName = action.payload.teamBName;
    },

    // ── SSE: end_game ──────────────────────────────────────────────────────
    applyEndGame(state, action: PayloadAction<SSEEndGamePayload>) {
      state.playState = 'FINISHED';
      const { winningTeam, teamName, teamATotal, teamBTotal, teamAName, teamBName } = action.payload;
      state.winner = { team: winningTeam, teamName, teamATotal, teamBTotal, teamAName, teamBName };
    },

    // Seed team names when we first load game metadata
    setTeamNames(state, action: PayloadAction<{ teamAName: string; teamBName: string }>) {
      state.teamAName = action.payload.teamAName;
      state.teamBName = action.payload.teamBName;
    },

    // Full reset when leaving a game
    resetGameState() {
      return initialState;
    },
  },
});

export const {
  applyBoardSnapshot,
  applyGameState,
  applyNextQuestion,
  applyRevealOption,
  applyWrongOption,
  applyAddScore,
  applyEndGame,
  setTeamNames,
  resetGameState,
} = gameStateSlice.actions;

export default gameStateSlice.reducer;
