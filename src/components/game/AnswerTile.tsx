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
    <div className={cn('answer-tile relative h-16 w-full perspective-800', revealed && 'is-flipped')}>
      <div className="answer-tile-inner relative h-full w-full transition-transform duration-500 ease-out">
        <div className="answer-tile-face answer-tile-front absolute inset-0 flex items-center justify-between overflow-hidden rounded-2xl bg-card px-5 text-sm font-black tracking-widest text-muted-foreground shadow-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-black">
            {rank}
          </span>
          <span className="mx-3 flex-1" />
          <span className="min-w-12" />
        </div>

        <div className="answer-tile-face answer-tile-back absolute inset-0 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-primary px-5 text-sm font-black tracking-widest text-primary-foreground shadow-glow">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-sm font-black">
            {rank}
          </span>
          <span className="mx-3 flex-1 text-center font-bold tracking-[0.2em] text-shadow-sm opacity-0 animate-answer-text-fade">
            {optionText}
          </span>
          {points !== undefined ? (
            <span className="flex min-w-12 items-center justify-center rounded-full bg-secondary px-3 py-1 text-sm font-black text-secondary-foreground shadow-sm">
              {points}
            </span>
          ) : (
            <span className="min-w-12" />
          )}
        </div>
      </div>
    </div>
  );
}
