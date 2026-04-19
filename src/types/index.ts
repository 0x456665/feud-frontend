// ─────────────────────────────────────────────
// Core Game Types
// ─────────────────────────────────────────────

export type VotingState = 'OPEN' | 'PAUSED' | 'CLOSED';
export type PlayState = 'LOBBY' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
export type Team = 'TEAM_A' | 'TEAM_B';

// A single answer option on a question
export interface Option {
  id: string;
  option_text: string;
  votes: number;
  rank: number | null;   // null until voting closes
  points: number | null; // null until voting closes
}

// A question with its options
export interface Question {
  id: string;
  question: string;
  number_of_options: number;
  std_dev: number | null;    // null until voting closes
  display_order: number | null; // null until game starts
  options: Option[];
}

// Full game object returned from admin endpoints
export interface Game {
  id: string;
  game_name: string;
  game_code: string;
  team_a_name: string;
  team_b_name: string;
  num_rounds: number;
  voting_state: VotingState;
  play_state: PlayState;
  created_at: string;
  questions: Question[];
}

// ─────────────────────────────────────────────
// Board / Gameplay Log
// ─────────────────────────────────────────────

// Active board state (used by both /board and /log)
export interface GameplayLog {
  id: string;
  game_id: string;
  team_a_score: number;
  team_b_score: number;
  current_question_id: string | null;
  options_revealed: string[];       // UUIDs of revealed options this round
  questions_completed: string[];    // UUIDs of fully played questions
  current_strikes: number;
  state_snapshot: {
    activeTeam: Team | null;
    lastScoringTeam: Team | null;
    scoredQuestionId?: string | null;
  };
  updated_at: string;
}

export interface BoardQuestionSnapshot {
  id: string;
  question_text: string;
  round_number: number;
  total_options: number;
}

export interface BoardRevealedOptionSnapshot {
  option_id: string;
  option_text: string;
  votes: number;
  rank: number;
  points: number;
}

export interface BoardWinnerSnapshot {
  winning_team: Team;
  team_name: string;
  team_a_total: number;
  team_b_total: number;
  team_a_name: string;
  team_b_name: string;
}

export interface BoardSnapshot extends GameplayLog {
  game_code: string;
  game_name: string;
  team_a_name: string;
  team_b_name: string;
  play_state: PlayState;
  voting_state: VotingState;
  current_question: BoardQuestionSnapshot | null;
  revealed_options: BoardRevealedOptionSnapshot[];
  winner: BoardWinnerSnapshot | null;
}

// ─────────────────────────────────────────────
// Survey Stats
// ─────────────────────────────────────────────

export interface SurveyOptionStat {
  id: string;
  option_text: string;
  votes: number;
  rank: number;
  points: number;
}

export interface SurveyQuestionStat {
  questionId: string;
  question: string;
  std_dev: number | null;
  totalVotes: number;
  options: SurveyOptionStat[];
}

export interface SurveyVoterCountResponse {
  totalVoters: number;
}

// ─────────────────────────────────────────────
// API Request / Response Shapes
// ─────────────────────────────────────────────

export interface CreateGamePayload {
  game_name: string;
  team_a_name?: string;
  team_b_name?: string;
  num_rounds: number;
  questions: Array<{
    question: string;
    options: string[];
  }>;
}

export interface UpdateGamePayload {
  game_name?: string;
  team_a_name?: string;
  team_b_name?: string;
}

export interface CreateGameResponse {
  message: string;
  game_code: string;
  admin_code: string; // shown ONCE — must be saved immediately
  game_id: string;
  team_a_name: string;
  team_b_name: string;
  num_rounds: number;
}

export interface JoinGameResponse {
  message: string;
  game_code: string;
}

export interface PlayerCountResponse {
  count: number;
}

export interface VoteSubmission {
  gameId: string;
  questionId: string;
  optionIds: string[]; // 0-3 UUIDs
}

export interface CastVotePayload {
  votes: VoteSubmission[];
}

// Response from GET /games/:gameCode/questions (public, voting must be OPEN)
export interface PublicOption {
  optionId: string;
  text: string;
}

export interface PublicQuestion {
  questionId: string;
  question: string;
  options: PublicOption[];
}

export interface PublicQuestionsResponse {
  gameId: string;
  gameName: string;
  questions: PublicQuestion[];
}

export interface EndGameResult {
  id: string;
  game_id: string;
  winning_team: Team;
  team_a_total: number;
  team_b_total: number;
  created_at: string;
}

// ─────────────────────────────────────────────
// SSE Event Payloads
// ─────────────────────────────────────────────

export interface SSEGameStatePayload {
  playState: PlayState;
  votingState: VotingState;
}

export interface SSENextQuestionPayload {
  questionId: string;
  questionText: string;
  totalOptions: number;
  roundNumber: number;
}

export interface SSERevealOptionPayload {
  optionId: string;
  optionText: string;
  votes: number;
  rank: number;
  points: number;
}

export interface SSEWrongOptionPayload {
  team: Team;
  teamName: string;
  strikeCount: number;
}

export interface SSEAddScorePayload {
  team: Team;
  teamName: string;
  points: number;
  teamATotal: number;
  teamBTotal: number;
  teamAName: string;
  teamBName: string;
}

export interface SSEVoteUpdatePayload {
  questionId: string;
  totalVotes: number;
}

export interface SSEPlayWinnerSoundPayload {
  winningTeam: Team;
  teamName: string;
}

export interface SSEEndGamePayload {
  winningTeam: Team;
  teamName: string;
  teamATotal: number;
  teamBTotal: number;
  teamAName: string;
  teamBName: string;
}

// Union of all possible SSE events the UI must handle
export type SSEEvent =
  | { type: 'game_state'; payload: SSEGameStatePayload }
  | { type: 'next_question'; payload: SSENextQuestionPayload }
  | { type: 'reveal_option'; payload: SSERevealOptionPayload }
  | { type: 'wrong_option'; payload: SSEWrongOptionPayload }
  | { type: 'add_score'; payload: SSEAddScorePayload }
  | { type: 'vote_update'; payload: SSEVoteUpdatePayload }
  | { type: 'play_winner_sound'; payload: SSEPlayWinnerSoundPayload }
  | { type: 'end_game'; payload: SSEEndGamePayload }
  | { type: 'heartbeat'; payload: Record<string, never> };

// ─────────────────────────────────────────────
// Live Game State (Redux slice shape)
// ─────────────────────────────────────────────

// A revealed answer tile on the board
export interface RevealedTile {
  optionId: string;
  optionText: string;
  votes: number;
  rank: number;
  points: number;
}

export interface LiveGameState {
  playState: PlayState | null;
  votingState: VotingState | null;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  currentQuestion: {
    id: string;
    text: string;
    totalOptions: number;
    roundNumber: number;
  } | null;
  revealedTiles: RevealedTile[]; // tiles revealed this round
  currentStrikes: number;
  winner: {
    team: Team;
    teamName: string;
    teamATotal: number;
    teamBTotal: number;
    teamAName: string;
    teamBName: string;
  } | null;
}

// ─────────────────────────────────────────────
// Admin Session (Redux slice shape)
// ─────────────────────────────────────────────

export interface AdminSession {
  gameCode: string | null;
  adminCode: string | null;
  gameId: string | null;
}

// ─────────────────────────────────────────────
// Error Envelope (API errors)
// ─────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}
