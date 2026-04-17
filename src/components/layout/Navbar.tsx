import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={`${link.to}:${link.label}`}
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
        <div className="hidden items-center md:flex">
          <Link
            to="/rules"
            className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Rules"
          >
            <HelpCircle className="size-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/rules"
            className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Rules"
          >
            <HelpCircle className="size-4" />
          </Link>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full border-border/60 bg-background/80"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,22rem)] border-border/50 bg-background/95 p-0 backdrop-blur-xl">
              <SheetHeader className="border-b border-border/30 px-5 py-5">
                <SheetTitle className="text-lg font-black text-primary">Feud</SheetTitle>
                <SheetDescription>
                  Jump between setup, survey, and the live board.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-2 px-4 py-4">
                {links.map((link) => {
                  const active = isActive(link);
                  return (
                    <Link
                      key={`${link.to}:${link.label}:mobile`}
                      to={link.to}
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary',
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <Link
                  to="/rules"
                  className="mt-2 rounded-2xl border border-border/50 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Rules
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
