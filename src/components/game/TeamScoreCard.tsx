import { cn } from '@/lib/utils';

interface TeamScoreCardProps {
  teamName: string;
  score: number;
  /** Highlight this card as the currently active/attacking team */
  isActive?: boolean;
  className?: string;
}

/**
 * Score display card for a single team.
 * Active team gets a highlighted border and slightly larger appearance.
 */
export function TeamScoreCard({ teamName, score, isActive, className }: TeamScoreCardProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col items-center justify-center rounded-[1.7rem] border px-4 py-4 text-center transition-all duration-300 shadow-glow sm:rounded-[2rem] sm:px-5 sm:py-5',
        isActive
          ? 'theme-inverse-panel scale-[1.02] border-white/20 text-primary-foreground'
          : 'theme-panel-strong border-border/70 text-foreground',
        className,
      )}
    >
      <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] sm:text-[11px] sm:tracking-[0.24em]', isActive ? 'text-white/78' : 'text-muted-foreground')}>
        {teamName}
      </span>
      <span className={cn('mt-2 text-4xl font-black tabular-nums sm:text-5xl xl:text-6xl', isActive ? 'text-white' : 'text-primary')}>
        {score}
      </span>
    </div>
  );
}
