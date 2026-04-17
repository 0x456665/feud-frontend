import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Zap, BookOpen, ChevronRight, Radio, Trophy, TimerReset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Home / Landing page — matches the Figma game-show aesthetic.
 *
 * Sections:
 *   1. Hero  — full-bleed lavender gradient, giant heading, buzzer CTAs
 *   2. Bento — feature card + how-it-works + mini stat cards
 *   3. Footer strip — rules link
 */
export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden spotlight-wash stage-grid">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/40 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-24 size-72 rounded-full bg-secondary/25 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-20 lg:pt-18">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {heroBadges.map((badge) => (
                <span key={badge} className="ticker-pill rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#69537B]">
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Turn your next game night into a
              <span className="block text-primary">full-blown studio showdown.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-foreground/90 sm:text-lg">
              Build a survey, collect real answers, then run the reveal round live with
              a scoreboard, strikes, and a board designed to feel like a proper broadcast.
            </p>

            <div className="mt-8 flex flex-wrap gap-5">
              <div className="rounded-[2rem] bg-background/90 px-5 py-4 shadow-glow backdrop-blur-md border border-[#69537B]">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-foreground/90">Host Flow</p>
                <p className="mt-2 text-lg font-black text-foreground">Create, survey, go live.</p>
              </div>
              <div className="rounded-[2rem] bg-background/90 px-5 py-4 shadow-glow backdrop-blur-md border border-[#69537B]">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-foreground/90">Player Flow</p>
                <p className="mt-2 text-lg font-black text-foreground">Join once, watch every reveal.</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5">
            <BuzzerButton
              to="/admin/create"
              label="Create Game"
              icon={<Plus className="size-8 stroke-[2.5]" />}
              className="gradient-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
            />
            <BuzzerButton
              to="/join"
              label="Join Game"
              icon={<Users className="size-7 stroke-[2.5]" />}
              className="bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95"
            />
            </div>
          </div>

          <div className="relative">
            <div className="stage-panel marquee-frame rounded-[2.2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/90">Tonight's Format</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-foreground">Broadcast Mode</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                  <Radio className="size-3" />
                  On Air
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {showFlow.map(({ title, description, Icon }) => (
                  <div key={title} className="flex items-start gap-3 rounded-[1.6rem] bg-background/90 px-4 py-4 shadow-sm backdrop-blur-sm">
                    <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-foreground/90">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.4rem] bg-primary px-4 py-4 text-center text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary-foreground/90">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <div className="mb-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl bg-card shadow-glow p-8">
            <div className="pointer-events-none absolute right-0 top-0 size-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-2xl" />
            <span className="mb-4 inline-block rounded-full bg-accent/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-accent drop-shadow-sm">
              Why It Works
            </span>
            <h2 className="mb-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Survey first. Reveal later. Let the room decide the board.
            </h2>
            <p className="mb-6 max-w-lg text-sm leading-7 text-foreground/90">
              Set up custom questions, let players vote before the show, then host
              a live round on the big screen — complete with buzzers, strikes and
              a scoreboard.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureCards.map(({ title, copy, Icon }) => (
                <div key={title} className="rounded-[1.6rem] bg-background/80 p-4 shadow-sm">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-3 text-sm font-black text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-foreground/90">{copy}</p>
                </div>
              ))}
            </div>

            <Link to="/rules" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-transform hover:scale-105">
              Read the rules <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="stage-panel marquee-frame flex flex-col gap-3 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground">Three Easy Steps</h3>
              <span className="rounded-full bg-background/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">Fast Setup</span>
            </div>
            {steps.map(({ num, title, description }) => (
              <div key={num} className="flex gap-3 rounded-[1.4rem] bg-background/90 px-4 py-4">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-foreground/90">{description}</p>
                </div>
              </div>
            ))}

            <div className="mt-2 rounded-[1.6rem] bg-primary px-5 py-4 text-primary-foreground">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-foreground/90">Best Use</p>
              <p className="mt-2 text-sm font-black">Perfect for watch parties, offices, birthdays, and church groups.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col justify-center rounded-3xl gradient-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] px-6 py-5 hover:scale-105 transition-transform">
            <p className="text-4xl font-black text-primary-foreground">Live</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
              Real-time Game Play
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[2rem] bg-card px-6 py-5 shadow-glow hover:scale-105 transition-transform">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Instant Buzzer</p>
              <p className="text-xs text-foreground/90">
                Low-latency play for that true studio feel.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-3xl bg-secondary px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-secondary-foreground hover:scale-105 transition-transform">
            <p className="mb-1 text-xs">★★★★★</p>
            <p className="text-sm font-semibold italic text-secondary-foreground/90">
              "Better than the actual show!"
            </p>
            <p className="mt-1 text-xs text-secondary-foreground/70">
              — Game Night Enthusiast
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer strip ──────────────────────────────────────────────── */}
      <div className="border-t-0 bg-primary px-4 py-8 text-center mt-auto shadow-glow">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/60">
          Feud
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
            <Link to="/rules" className='flex items-center gap-1'>
              <BookOpen className="mr-1.5 size-4" />
              Rules
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
            <Link to="/admin/create" className='flex'>
              <Plus className="mr-1.5 size-4" />
              Create Game
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
            <Link to="/join" className='flex'>
              <Users className="mr-1.5 size-4" />
              Join Game
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-white/50">© 2026 Feud</p>
      </div>
    </main>
  );
}

// ── Buzzer CTA button ──────────────────────────────────────────────────────

function BuzzerButton({
  to,
  label,
  icon,
  className,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex w-36 flex-col items-center justify-center gap-2.5 rounded-[20px] py-7 transition-all duration-100 ease-out sm:w-44 sm:py-8',
        className,
      )}
    >
      {icon}
      <span className="text-xs font-extrabold uppercase tracking-widest sm:text-sm">
        {label}
      </span>
    </Link>
  );
}

// ── Step data ──────────────────────────────────────────────────────────────

const steps = [
  { num: '1', title: 'Create & Survey', description: 'Build your questions and open player voting.' },
  { num: '2', title: 'Players Join', description: 'Share the game code — up to 100 players.' },
  { num: '3', title: 'Play Live', description: 'Reveal answers, strike out, and crown a winner.' },
];

const heroBadges = ['Survey Powered', 'Live Hosted', 'SSE Board'];

const heroStats = [
  { value: '3', label: 'Phases' },
  { value: '∞', label: 'Drama' },
  { value: '1', label: 'Winner' },
];

const showFlow = [
  {
    title: 'Collect the room',
    description: 'Open the survey and let players shape the final board before the game begins.',
    Icon: TimerReset,
  },
  {
    title: 'Run the reveal',
    description: 'Advance rounds, flip answers, trigger strikes, and award points from one control surface.',
    Icon: Radio,
  },
  {
    title: 'Crown the winner',
    description: 'Finish with a proper end-state, final tally, and a board that still looks good on refresh.',
    Icon: Trophy,
  },
];

const featureCards = [
  {
    title: 'Host Controls',
    copy: 'Close voting, start the match, reveal answers, and manage scores without page thrash.',
    Icon: Plus,
  },
  {
    title: 'Player Survey',
    copy: 'Players join quickly, vote in batches, and stay synced through reconnects.',
    Icon: Users,
  },
  {
    title: 'Board Sync',
    copy: 'Snapshots and live events keep the board usable even after refresh or stream hiccups.',
    Icon: Zap,
  },
];
