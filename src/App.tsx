import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/layout/Navbar';

// Pages
import Home from '@/pages/Home';
import Rules from '@/pages/Rules';
import CreateGame from '@/pages/admin/CreateGame';
import GameCreated from '@/pages/admin/GameCreated';
import AdminAccess from '@/pages/admin/AdminAccess';
import GameLobby from '@/pages/admin/GameLobby';
import LiveGame from '@/pages/admin/LiveGame';
import SurveyEditor from '@/pages/admin/SurveyEditor';
import JoinGame from '@/pages/player/JoinGame';
import PlayerGame from '@/pages/player/PlayerGame';
import VotingPage from '@/pages/player/VotingPage';
import GameBoard from '@/pages/player/GameBoard';
import GameEnd from '@/pages/player/GameEnd';
import { AdminGuard } from '@/components/layout/AdminGuard';

/**
 * Application root.
 *
 * Route structure:
 *   /                          → Home (landing)
 *   /rules                     → Rules
 *   /join                      → Player: enter game code
 *   /game/:gameCode            → Player: lobby / auto-route based on play state
 *   /game/:gameCode/vote       → Player: voting page
 *   /game/:gameCode/board      → Player: live read-only board
 *   /game/:gameCode/end        → Player: final results
 *   /admin/create              → Admin: create new game
 *   /admin/game/:gameCode      → Admin: game lobby (voting controls, stats)
 *   /admin/game/:gameCode/live → Admin: live game control
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Sonner toast notifications */}
        <Toaster position="top-right" richColors theme='light' closeButton />

        {/* Top navigation — hidden on full-screen game board */}
        <Navbar />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<Rules />} />

          {/* Player flow */}
          <Route path="/join" element={<JoinGame />} />
          <Route path="/game/:gameCode" element={<PlayerGame />} />
          <Route path="/game/:gameCode/vote" element={<VotingPage />} />
          <Route path="/game/:gameCode/board" element={<GameBoard />} />
          <Route path="/game/:gameCode/end" element={<GameEnd />} />

          {/* Admin flow */}
          <Route path="/admin/create" element={<CreateGame />} />
          <Route path="/admin/access" element={<AdminAccess />} />
          <Route path="/admin/game/:gameCode/created" element={<AdminGuard><GameCreated /></AdminGuard>} />
          <Route path="/admin/game/:gameCode" element={<AdminGuard><GameLobby /></AdminGuard>} />
          <Route path="/admin/game/:gameCode/survey-edit" element={<AdminGuard><SurveyEditor /></AdminGuard>} />
          <Route path="/admin/game/:gameCode/live" element={<AdminGuard><LiveGame /></AdminGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

