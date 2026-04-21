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
    <div className={cn('answer-tile relative h-full w-full overflow-hidden perspective-800', revealed && 'is-flipped', className)}>
      <div className="answer-tile-inner relative h-full w-full transition-transform duration-500 ease-out">
        <div className="answer-tile-face answer-tile-front absolute inset-0 flex items-center justify-between gap-[3%] overflow-hidden rounded-[1.2rem] border border-border/70 bg-card/95 px-[4%] py-[5%] text-sm font-black tracking-[0.16em] text-foreground shadow-[0_18px_40px_rgba(36,26,56,0.12)] backdrop-blur-sm sm:rounded-[1.45rem]">
          <span className="flex aspect-square w-[12%] min-w-8 max-w-11 shrink-0 items-center justify-center rounded-full bg-primary text-[clamp(0.72rem,0.95vw,0.95rem)] font-black text-primary-foreground shadow-sm">
            {rank}
          </span>
          <span className="flex-1 text-center text-[clamp(0.55rem,0.82vw,0.82rem)] uppercase tracking-[0.18em] text-foreground/40 sm:tracking-[0.22em]">
            Top answer hidden
          </span>
          <span className="w-[12%] min-w-8 max-w-11 shrink-0" />
        </div>

        <div className="answer-tile-face answer-tile-back theme-inverse-panel absolute inset-0 flex items-center justify-between gap-[3%] overflow-hidden rounded-[1.2rem] px-[4%] py-[5%] text-sm font-black shadow-[0_24px_60px_rgba(36,26,56,0.24)] sm:rounded-[1.45rem]">
          <span className="flex aspect-square w-[12%] min-w-8 max-w-11 shrink-0 items-center justify-center rounded-full bg-white/18 text-[clamp(0.72rem,0.95vw,0.95rem)] font-black text-white shadow-sm">
            {rank}
          </span>
          <span className="flex-1 text-center text-[clamp(0.82rem,1.2vw,1.18rem)] font-black leading-tight tracking-[0.03em] text-white opacity-0 animate-answer-text-fade">
            {optionText}
          </span>
          {points !== undefined ? (
            <span className="flex min-w-[14%] items-center justify-center rounded-full bg-secondary px-[4%] py-[3%] text-[clamp(0.82rem,1.1vw,1.05rem)] font-black text-secondary-foreground shadow-sm">
              {points}
            </span>
          ) : (
            <span className="min-w-[14%]" />
          )}
        </div>
      </div>
    </div>
  );
}
