import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { BASE_URL } from '@/lib/constants';
import { playSound } from '@/lib/sound';
import type { SSEEvent } from '@/types';
import {
  applyGameState,
  applyNextQuestion,
  applyRevealOption,
  applyWrongOption,
  applyAddScore,
  applyEndGame,
} from '@/store/slices/gameStateSlice';

/**
 * useGameEvents
 *
 * Opens an SSE connection to /events/:gameCode and dispatches the appropriate
 * Redux actions for each incoming event.
 *
 * On error / disconnect it calls onDisconnect() so the caller can:
 *   1. Re-fetch GET /board (or /log) to rebuild state
 *   2. Re-call this hook / re-open the connection
 *
 * The connection is closed automatically when:
 *   - The component unmounts
 *   - The server sends end_game (play_state becomes FINISHED)
 *
 * @param gameCode  6-character game code
 * @param onDisconnect  called when the stream closes unexpectedly
 * @param onVoteUpdate  optional callback for vote_update events (admin stats panel)
 */
export function useGameEvents(
  gameCode: string | null,
  onDisconnect: () => void,
  onVoteUpdate?: (payload: { questionId: string; totalVotes: number }) => void,
) {
  const dispatch = useDispatch<AppDispatch>();

  // Keep the EventSource in a ref so closing it doesn't cause re-renders
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const manualCloseRef = useRef(false);

  // Stable reference to onVoteUpdate to avoid re-connecting on every re-render
  const onVoteUpdateRef = useRef(onVoteUpdate);
  useEffect(() => { onVoteUpdateRef.current = onVoteUpdate; }, [onVoteUpdate]);

  const onDisconnectRef = useRef(onDisconnect);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);

  const closeConnection = useCallback(() => {
    manualCloseRef.current = true;

    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!gameCode) return;

    let isActive = true;

    const handleIncomingEvent = (event: MessageEvent<string>) => {
      let parsed: SSEEvent;

      try {
        parsed = JSON.parse(event.data) as SSEEvent;
      } catch {
        return; // Ignore malformed messages
      }

      const { type, payload } = parsed;

      // Skip heartbeats — they're just keep-alive pings
      if (type === 'heartbeat') return;

      switch (type) {
        case 'game_state':
          dispatch(applyGameState(payload));
          break;

        case 'next_question':
          dispatch(applyNextQuestion(payload));
          break;

        case 'reveal_option':
          dispatch(applyRevealOption(payload));
          playSound('reveal');
          break;

        case 'wrong_option':
          dispatch(applyWrongOption(payload));
          playSound('buzzer');
          break;

        case 'add_score':
          dispatch(applyAddScore(payload));
          playSound('score');
          break;

        case 'vote_update':
          // Not stored in Redux — forwarded to caller (e.g. admin stats panel)
          onVoteUpdateRef.current?.(payload);
          break;

        case 'play_winner_sound':
          // Play fanfare — end_game SSE will follow and update Redux state
          playSound('winner');
          break;

        case 'end_game':
          dispatch(applyEndGame(payload));
          // Server closes the stream after this — close our side too
          closeConnection();
          break;

        default:
          // Unknown event type — safe to ignore
          break;
      }
    };

    const connect = () => {
      if (!isActive || sourceRef.current) return;

      manualCloseRef.current = false;

      const source = new EventSource(`${BASE_URL}/events/${gameCode}`, {
        withCredentials: true,
      });

      sourceRef.current = source;
      source.onmessage = handleIncomingEvent;

      const eventTypes: SSEEvent['type'][] = [
        'game_state',
        'next_question',
        'reveal_option',
        'wrong_option',
        'add_score',
        'vote_update',
        'play_winner_sound',
        'end_game',
        'heartbeat',
      ];

      for (const eventType of eventTypes) {
        source.addEventListener(eventType, handleIncomingEvent as EventListener);
      }

      source.onerror = () => {
        source.close();

        if (sourceRef.current === source) {
          sourceRef.current = null;
        }

        if (manualCloseRef.current) {
          return;
        }

        onDisconnectRef.current();

        if (!isActive || reconnectTimerRef.current !== null) {
          return;
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, 2000);
      };
    };

    connect();

    // Cleanup on unmount or when gameCode changes
    return () => {
      isActive = false;
      closeConnection();
    };
  }, [gameCode, dispatch, closeConnection]);

  return { closeConnection };
}
