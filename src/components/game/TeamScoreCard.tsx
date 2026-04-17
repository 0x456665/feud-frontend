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
        'flex flex-col items-center justify-center rounded-[2rem] p-6 transition-all duration-300 shadow-glow',
        isActive
          ? 'bg-gradient-primary text-primary-foreground scale-105'
          : 'bg-card text-foreground',
        className,
      )}
    >
      <span className={cn('text-[10px] font-black uppercase tracking-widest', isActive ? 'text-white/70' : 'text-muted-foreground')}>
        {teamName}
      </span>
      <span className={cn('mt-2 text-5xl font-black tabular-nums', isActive ? 'text-white' : 'text-primary')}>{score}</span>
    </div>
  );
}
