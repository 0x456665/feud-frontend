import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setAdminSession } from '@/store/slices/adminSessionSlice';
import { useLazyGetGameQuery } from '@/store/api/adminApi';
import type { AppDispatch } from '@/store';

/**
 * Admin Access page — /admin/access
 *
 * Two entry points:
 *  1. Via URL params: /admin/access?game=XXXX&code=YYYY
 *     The shared admin link auto-verifies and redirects immediately.
 *  2. Manual entry: type game code + admin code to authenticate.
 */
export default function AdminAccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [params] = useSearchParams();

  const prefillGame = params.get('game') ?? '';
  const prefillCode = params.get('code') ?? '';
  const isAutoLink = prefillGame.length > 0 && prefillCode.length > 0;

  const [gameCode, setGameCode] = useState(prefillGame.toUpperCase());
  const [adminCode, setAdminCode] = useState(prefillCode);
  const [isLoading, setIsLoading] = useState(isAutoLink);

  const [triggerGetGame] = useLazyGetGameQuery();

  async function authenticate(code: string, secret: string) {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedSecret = secret.trim();

    // Set session first so the API header is injected
    dispatch(setAdminSession({ gameCode: trimmedCode, adminCode: trimmedSecret, gameId: '' }));

    try {
      const game = await triggerGetGame(trimmedCode).unwrap();
      dispatch(setAdminSession({ gameCode: trimmedCode, adminCode: trimmedSecret, gameId: game.id }));
      toast.success('Admin access granted!');
      navigate(`/admin/game/${trimmedCode}`, { replace: true });
    } catch {
      // Clear the optimistic session on failure
      dispatch(setAdminSession({ gameCode: '', adminCode: '', gameId: '' }));
      toast.error('Invalid game code or admin code.');
      setIsLoading(false);
    }
  }

  // Auto-link: trigger on mount when URL params are present
  useEffect(() => {
    if (isAutoLink) {
      authenticate(prefillGame, prefillCode);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (gameCode.trim().length !== 6) {
      toast.error('Game code must be 6 characters.');
      return;
    }
    if (!adminCode.trim()) {
      toast.error('Admin code is required.');
      return;
    }
    setIsLoading(true);
    await authenticate(gameCode, adminCode);
  }

  return (
    <main className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,oklch(0.91_0.06_293)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -left-16 top-1/4 size-60 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-1/4 size-52 rounded-full bg-[oklch(0.87_0.18_80)]/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <ShieldCheck className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Admin <span className="text-primary">Access</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoading && isAutoLink
              ? 'Verifying your admin link…'
              : 'Enter your game code and admin code to control the game.'}
          </p>
        </div>

        {/* Auto-link loading */}
        {isLoading && isAutoLink ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-[oklch(0.95_0.04_290)] p-7 shadow-lg"
          >
            {/* Game code */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                Game Code
              </label>
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-center font-mono text-xl font-black tracking-widest text-foreground outline-none transition-colors focus:border-primary"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {/* Admin code */}
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                Admin Code
              </label>
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Paste your admin code"
                className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-primary"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-[0_4px_0_oklch(0.38_0.20_293)] transition-all hover:translate-y-px hover:shadow-[0_2px_0_oklch(0.38_0.20_293)] active:translate-y-0.75 active:shadow-none disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="mx-auto size-5 animate-spin" />
              ) : (
                'Enter Dashboard'
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
