/**
 * Sound Manager
 *
 * Provides hooks for playing game sounds (buzzer, reveal, score, win fanfare).
 * All sounds are optional — if an audio file isn't present in /public/sounds/,
 * the call silently does nothing.
 *
 * To add sounds: drop .mp3 / .ogg files into public/sounds/ and map them below.
 *
 * Usage:
 *   import { playSound } from '@/lib/sound';
 *   playSound('buzzer');
 */

// Map of sound identifiers to their public URL paths
const SOUND_MAP: Record<string, string> = {
  // Played when a wrong answer is given
  buzzer: '/sounds/buzzer.mp3',

  // Played when an answer tile is revealed
  reveal: '/sounds/reveal.mp3',

  // Played when points are added to a team's score
  score: '/sounds/score.mp3',

  // Played when the game ends and there's a winner (fanfare)
  winner: '/sounds/winner.mp3',

  // Played when a player successfully submits a vote
  vote: '/sounds/vote.mp3',
};

// Cache loaded Audio objects to avoid re-fetching
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Plays a named game sound.
 * Silently ignores errors (missing files, browser autoplay restrictions, etc.)
 */
export function playSound(name: keyof typeof SOUND_MAP, volume = 0.8): void {
  const path = SOUND_MAP[name];
  if (!path) return;

  try {
    // Reuse cached Audio element, or create a new one
    if (!audioCache[name]) {
      audioCache[name] = new Audio(path);
    }

    const audio = audioCache[name];
    audio.volume = volume;

    // Rewind if already playing, then play
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silently ignore autoplay policy blocks
    });
  } catch {
    // Ignore any other errors (missing file, codec unsupported, etc.)
  }
}

/**
 * Pre-loads sounds in the background so the first play has no delay.
 * Call this once when the game is about to go live.
 */
export function preloadSounds(): void {
  Object.entries(SOUND_MAP).forEach(([name, path]) => {
    if (!audioCache[name]) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache[name] = audio;
    }
  });
}

/**
 * Unlocks the browser's autoplay policy for this page by playing a silent
 * audio element in response to a user gesture.  Must be called inside a
 * user-interaction event handler (click, keydown, touchstart, etc.).
 *
 * After this runs once, subsequent `playSound` calls work without a gesture.
 */
export function unlockAudio(): void {
  // Play each cached (or newly created) audio element silently for a single
  // frame to satisfy the browser's "user activated" requirement.
  Object.entries(SOUND_MAP).forEach(([name, path]) => {
    if (!audioCache[name]) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache[name] = audio;
    }
    const audio = audioCache[name];
    audio.muted = true;
    audio.play().then(() => {
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
    }).catch(() => { /* already unlocked or file missing */ });
  });
}
