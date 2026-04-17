import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useJoinGameMutation } from '@/store/api/playerApi';

const CODE_LEN = 6;

export default function JoinGame() {
  const navigate = useNavigate();
  const [joinGame, { isLoading }] = useJoinGameMutation();
  const [boxes, setBoxes] = useState<string[]>(Array(CODE_LEN).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const gameCode = boxes.join('').toUpperCase();

  const setRef = useCallback((el: HTMLInputElement | null, i: number) => {
    inputRefs.current[i] = el;
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === 'Backspace') {
      if (boxes[idx] === '' && idx > 0) {
        const next = [...boxes];
        next[idx - 1] = '';
        setBoxes(next);
        inputRefs.current[idx - 1]?.focus();
      } else {
        const next = [...boxes];
        next[idx] = '';
        setBoxes(next);
      }
      e.preventDefault();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (val.length === 0) return;
    if (val.length === CODE_LEN) {
      const chars = val.slice(0, CODE_LEN).split('');
      setBoxes(chars);
      inputRefs.current[CODE_LEN - 1]?.focus();
      return;
    }
    const char = val[val.length - 1];
    const next = [...boxes];
    next[idx] = char;
    setBoxes(next);
    if (idx < CODE_LEN - 1) inputRefs.current[idx + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\s/g, '').toUpperCase();
    const chars = pasted.slice(0, CODE_LEN).split('');
    const next = Array(CODE_LEN).fill('');
    chars.forEach((c, i) => { next[i] = c; });
    setBoxes(next);
    inputRefs.current[Math.min(chars.length, CODE_LEN - 1)]?.focus();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = gameCode.trim();
    if (trimmed.length !== CODE_LEN) {
      toast.error('Game codes are exactly 6 characters.');
      return;
    }
    try {
      await joinGame(trimmed).unwrap();
      toast.success(`Joined game ${trimmed}!`);
      navigate(`/game/${trimmed}`);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string }; message?: string })?.data?.message ??
        (err as { message?: string })?.message ??
        'Game not found. Check the code and try again.';
      toast.error(msg);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-10" />
      <div className="pointer-events-none absolute -left-16 top-1/4 size-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 top-1/3 size-56 rounded-full bg-accent/25 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Heading */}
        <div className="mb-6 text-center">
          <p className="mb-2 text-[10px] font-black tracking-[0.3em] text-primary uppercase">
            The Stage Is Set
          </p>
          <h1 className="text-5xl font-black tracking-tight text-foreground">
            Enter the <span className="text-primary">Arena</span>
          </h1>
        </div>

        {/* Card */}
        <form
          onSubmit={handleJoin}
          className="rounded-[2rem] bg-card p-7 shadow-glow"
        >
          {/* Code input */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-bold text-foreground">Game Room Code</p>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {boxes.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => setRef(el, i)}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKey(e, i)}
                  className="h-14 w-full rounded-2xl border border-border/15 bg-input text-center text-xl font-black text-foreground outline-none transition-colors focus:border-primary focus:border-2"
                />
              ))}
            </div>
          </div>

          {/* Join button */}
          <button
            type="submit"
            disabled={isLoading || gameCode.length < CODE_LEN}
            className="w-full rounded-2xl bg-secondary py-4 text-base font-black text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-60 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="mx-auto size-5 animate-spin" />
            ) : (
              'Join Game \u2192'
            )}
          </button>

          {/* Hint */}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lightbulb className="size-3.5 text-accent" />
            Don&apos;t have a code? Ask your host!
          </p>
        </form>

        {/* Host link */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Want to host?{' '}
          <Link to="/admin/create" className="font-semibold text-primary hover:underline">
            Create a game
          </Link>
        </p>
      </div>
    </main>
  );
}
