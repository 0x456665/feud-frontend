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
        'flex h-full w-full flex-col items-center justify-center rounded-[1.55rem] border px-[9%] py-[10%] text-center transition-all duration-300 shadow-glow sm:rounded-[1.9rem]',
        isActive
          ? 'theme-inverse-panel scale-[1.02] border-white/20 text-primary-foreground'
          : 'theme-panel-strong border-border/70 text-foreground',
        className,
      )}
    >
      <span className={cn('text-[clamp(0.6rem,0.8vw,0.82rem)] font-black uppercase tracking-[0.22em]', isActive ? 'text-white/78' : 'text-muted-foreground')}>
        {teamName}
      </span>
      <span className={cn('mt-[6%] text-[clamp(2rem,4vw,4.25rem)] font-black leading-none tabular-nums', isActive ? 'text-white' : 'text-primary')}>
        {score}
      </span>
    </div>
  );
}
