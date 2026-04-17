import { cn } from '@/lib/utils';

interface AnswerTileProps {
  /** 1-based rank of this tile; also determines visual order */
  rank: number;
  /** Text shown when the tile is revealed */
  optionText?: string;
  /** Points value shown when revealed */
  points?: number;
  /** Whether the tile has been flipped / revealed */
  revealed: boolean;
  /** Blank tiles just show a numbered slot */
  totalSlots?: number;
}

/**
 * A single answer tile on the game board.
 *
 * Unrevealed: shows a numbered slot (rank number on dark background).
 * Revealed: flips to show the answer text and its points value.
 */
export function AnswerTile({ rank, optionText, points, revealed }: AnswerTileProps) {
  return (
    <div
      className={cn(
        'relative flex h-16 items-center justify-between overflow-hidden rounded-2xl px-5 text-sm font-black tracking-widest transition-all duration-300 uppercase',
        revealed
          ? 'bg-gradient-primary text-primary-foreground shadow-glow'
          : 'bg-card text-muted-foreground shadow-sm',
      )}
    >
      {/* Rank number badge */}
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black',
          revealed ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
        )}
      >
        {rank}
      </span>

      {/* Answer text — only visible when revealed */}
      {revealed && optionText ? (
        <span className="mx-3 flex-1 text-center font-bold tracking-[0.2em] text-shadow-sm">
          {optionText}
        </span>
      ) : (
        <span className="mx-3 flex-1" />
      )}

      {/* Points badge */}
      {revealed && points !== undefined ? (
        <span className="flex min-w-12 items-center justify-center rounded-full bg-secondary px-3 py-1 text-sm font-black text-secondary-foreground shadow-sm">
          {points}
        </span>
      ) : (
        <span className="min-w-12" />
      )}
    </div>
  );
}
