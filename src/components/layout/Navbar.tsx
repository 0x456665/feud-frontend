import { Link, useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Top navigation bar — matches the Figma design:
 * bold brand left, spaced nav links center-right, help icon far right.
 * Active link gets a yellow/accent underline.
 */
export function Navbar() {
  const location = useLocation();
  const currentGameCode =
    location.pathname.match(/\/game\/([^/]+)/)?.[1]?.toUpperCase() ?? null;
  const boardHref = currentGameCode ? `/game/${currentGameCode}/board` : '/join';

  const links = [
    { to: '/admin/create', label: 'Setup' },
    { to: '/join', label: 'Survey' },
    { to: boardHref, label: 'Game Board', matchPrefix: '/game/' },
  ];

  function isActive(link: (typeof links)[number]) {
    if (link.matchPrefix) return location.pathname.startsWith(link.matchPrefix);
    return location.pathname === link.to;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg font-black tracking-tight text-primary hover:opacity-80 transition-opacity"
        >
          Feud
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'relative px-4 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full bg-secondary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Help icon */}
        <Link
          to="/rules"
          className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          aria-label="Rules"
        >
          <HelpCircle className="size-4" />
        </Link>
      </div>
    </header>
  );
}
