import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  /** Set to true for full-bleed game board pages that shouldn't have padding */
  fullBleed?: boolean;
}

/**
 * Standard page container with consistent max-width and padding.
 * Use `fullBleed` for the game board and similar immersive screens.
 */
export function PageWrapper({ children, className, fullBleed = false }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'flex-1',
        !fullBleed && 'mx-auto w-full max-w-5xl px-4 py-8',
        className,
      )}
    >
      {children}
    </main>
  );
}
