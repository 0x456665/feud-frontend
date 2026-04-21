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
  className?: string;
}

/**
 * A single answer tile on the game board.
 *
 * Unrevealed: shows a numbered slot (rank number on dark background).
 * Revealed: flips to show the answer text and its points value.
 */
export function AnswerTile({ rank, optionText, points, revealed, className }: AnswerTileProps) {
  return (
    <div className={cn('answer-tile relative h-full min-h-0 w-full perspective-800', revealed && 'is-flipped', className)}>
      <div className="answer-tile-inner relative h-full w-full transition-transform duration-500 ease-out">
        <div className="answer-tile-face answer-tile-front absolute inset-0 flex items-center justify-between gap-2 overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/95 px-3 py-2 text-sm font-black tracking-[0.16em] text-foreground shadow-[0_18px_40px_rgba(36,26,56,0.12)] backdrop-blur-sm sm:rounded-[1.55rem] sm:px-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground shadow-sm sm:size-9 sm:text-sm">
            {rank}
          </span>
          <span className="mx-1 flex-1 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/40 sm:mx-2 sm:text-xs sm:tracking-[0.22em]">
            Top answer hidden
          </span>
          <span className="min-w-8 sm:min-w-10" />
        </div>

        <div className="answer-tile-face answer-tile-back theme-inverse-panel absolute inset-0 flex items-center justify-between gap-2 overflow-hidden rounded-[1.35rem] px-3 py-2 text-sm font-black shadow-[0_24px_60px_rgba(36,26,56,0.24)] sm:rounded-[1.55rem] sm:px-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/18 text-xs font-black text-white shadow-sm sm:size-9 sm:text-sm">
            {rank}
          </span>
          <span className="mx-1 flex-1 text-center text-sm font-black leading-tight tracking-[0.04em] text-white opacity-0 animate-answer-text-fade sm:mx-2 sm:text-base lg:text-lg">
            {optionText}
          </span>
          {points !== undefined ? (
            <span className="flex min-w-10 items-center justify-center rounded-full bg-secondary px-2.5 py-1 text-sm font-black text-secondary-foreground shadow-sm sm:min-w-12 sm:px-3 sm:py-1.5 sm:text-base">
              {points}
            </span>
          ) : (
            <span className="min-w-10 sm:min-w-12" />
          )}
        </div>
      </div>
    </div>
  );
}
