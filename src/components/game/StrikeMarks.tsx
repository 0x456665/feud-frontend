import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrikeMarksProps {
  /** Number of strikes recorded this round (0–3 typically) */
  count: number;
  /** Max strikes before the round ends — for rendering empty slots */
  max?: number;
  className?: string;
}

/**
 * Renders × marks for wrong answers.
 * Active strikes are shown in destructive red; empty slots are muted.
 */
export function StrikeMarks({ count, max = 3, className }: StrikeMarksProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex size-10 items-center justify-center rounded-full font-black transition-all duration-300',
            i < count
              ? 'bg-destructive text-destructive-foreground scale-110 shadow-[0_0_20px_rgba(255,0,0,0.4)]'
              : 'bg-muted text-muted-foreground/30',
          )}
        >
          <X className="size-6" strokeWidth={4} />
        </div>
      ))}
    </div>
  );
}
