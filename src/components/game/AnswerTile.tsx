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
    <div className={cn('answer-tile relative h-24 w-full perspective-800 sm:h-28', revealed && 'is-flipped')}>
      <div className="answer-tile-inner relative h-full w-full transition-transform duration-500 ease-out">
        <div className="answer-tile-face answer-tile-front absolute inset-0 flex items-center justify-between overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/95 px-5 text-sm font-black tracking-[0.18em] text-foreground shadow-[0_18px_40px_rgba(36,26,56,0.12)] backdrop-blur-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-sm">
            {rank}
          </span>
          <span className="mx-3 flex-1 text-center text-xs uppercase tracking-[0.22em] text-foreground/40 sm:text-sm">
            Top answer hidden
          </span>
          <span className="min-w-12" />
        </div>

        <div className="answer-tile-face answer-tile-back theme-inverse-panel absolute inset-0 flex items-center justify-between overflow-hidden rounded-[1.7rem] px-5 text-sm font-black shadow-[0_24px_60px_rgba(36,26,56,0.24)]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/18 text-sm font-black text-white shadow-sm">
            {rank}
          </span>
          <span className="mx-3 flex-1 text-center text-base font-black leading-tight tracking-[0.08em] text-white opacity-0 animate-answer-text-fade sm:text-lg">
            {optionText}
          </span>
          {points !== undefined ? (
            <span className="flex min-w-14 items-center justify-center rounded-full bg-secondary px-3 py-1.5 text-base font-black text-secondary-foreground shadow-sm">
              {points}
            </span>
          ) : (
            <span className="min-w-14" />
          )}
        </div>
      </div>
    </div>
  );
}
