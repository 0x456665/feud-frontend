import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Copy, CheckCheck, ArrowRight, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import type { RootState } from '@/store';

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${label} copied!`);
    });
  }

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/50">
        {label}
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <span className="min-w-0 flex-1 overflow-hidden break-all rounded-xl border border-border bg-background px-3 py-2 font-mono text-[11px] leading-5 text-foreground">
          {url}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/80 sm:size-9 sm:w-auto"
        >
          {copied ? <CheckCheck className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export default function GameCreated() {
  const { gameCode = '' } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const adminCode = useSelector((s: RootState) => s.adminSession.adminCode);

  const origin = window.location.origin;
  const joinUrl = `${origin}/join`;
  const voteUrl = `${origin}/game/${gameCode}/vote`;
  const adminAccessUrl = adminCode
    ? `${origin}/admin/access?game=${gameCode}&code=${encodeURIComponent(adminCode)}`
    : null;

  return (
    <div className="flex min-h-[calc(100vh-56px)] overflow-x-hidden bg-background">
      <AdminSidebar gameCode={gameCode} active="setup" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 sm:size-14">
              <span className="text-2xl">🎉</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">
              Game{' '}
              <span className="break-all font-mono text-primary">{gameCode}</span>{' '}
              Created!
            </h1>
            <p className="mt-2 text-sm text-soft">
              Share these links with your players to get started.
            </p>
          </div>

          {/* Admin code callout */}
          {adminCode && (
            <div className="mb-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-800">
                Your Admin Code — save this now!
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="min-w-0 flex-1 break-all rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-center font-mono text-base font-black tracking-[0.18em] text-gray-900 sm:text-left sm:text-xl sm:tracking-widest">
                  {adminCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(adminCode);
                    toast.success('Admin code copied!');
                  }}
                  className="flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 sm:size-10 sm:w-auto"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-amber-800">
                This is shown once and stored in your browser for this session.
              </p>
            </div>
          )}

          {/* Shareable admin link */}
          {adminAccessUrl && (
            <div className="mb-5 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <p className="text-sm font-black text-foreground">Admin Access Link</p>
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground sm:ml-auto">
                  Keep private
                </span>
              </div>
              <p className="mb-4 text-xs font-medium text-foreground/70">
                Share with a co-host to give them full admin control. Anyone with this link can manage the game.
              </p>
              <div className="min-w-0">
                <CopyRow label="Admin Link" url={adminAccessUrl} />
                <p className="mt-2 text-[11px] font-medium text-foreground/50">
                  The link encodes the admin code — treat it like a password.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Join link card */}
            <div className="theme-panel rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <p className="text-sm font-black text-foreground">Join Link</p>
              </div>
              <p className="mb-3 text-sm font-medium text-soft">
                Players scan to reach the join page — they enter code{' '}
                <span className="font-mono font-black text-primary">{gameCode}</span>
              </p>
              <CopyRow label="Join URL" url={joinUrl} />
            </div>

            {/* Vote link card */}
            <div className="theme-panel rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="size-4 text-primary" />
                </div>
                <p className="text-sm font-black text-foreground">Voting Link</p>
              </div>
              <p className="mb-3 text-sm font-medium text-soft">
                Direct survey link — share once voting is open.
              </p>
              <CopyRow label="Vote URL" url={voteUrl} />
            </div>
          </div>

          {/* Game code pill */}
          <div className="theme-panel mt-4 rounded-2xl p-5 text-center">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-foreground/50">
              Game Code
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <span className="break-all text-center font-mono text-2xl font-black tracking-[0.14em] text-primary sm:text-4xl sm:tracking-[0.2em]">
                {gameCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(gameCode);
                  toast.success('Game code copied!');
                }}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 sm:size-9 sm:w-auto"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate(`/admin/game/${gameCode}`)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-[0_4px_0_oklch(0.38_0.20_293)] transition-all hover:translate-y-px hover:shadow-[0_2px_0_oklch(0.38_0.20_293)] active:translate-y-0.75 active:shadow-none"
          >
            Go to Survey Dashboard
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
