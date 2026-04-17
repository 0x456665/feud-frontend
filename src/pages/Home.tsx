import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Zap, ChevronRight, Radio, Trophy, TimerReset, Sparkles, ArrowRight } from 'lucide-react';
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

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-20 lg:pt-18">
          <div className="animate-enter-up">
            <div className="mb-5 flex flex-wrap gap-2">
              {heroBadges.map((badge) => (
                <span key={badge} className="ticker-pill badge-pill px-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#69537B]">
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Turn your next game night into a
              <span className="block text-primary">full-blown studio showdown.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-foreground/90 sm:text-lg">
              Build a survey, collect real answers, then run the reveal round live with
              a scoreboard, strikes, and a board designed to feel like a proper broadcast.
            </p>

            <div className="animate-enter-up-delay mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-[#69537B] bg-background/90 px-5 py-4 shadow-glow backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-foreground/90">Host Flow</p>
                <p className="mt-2 text-base font-black text-foreground sm:text-lg">Create, survey, go live.</p>
              </div>
              <div className="rounded-[2rem] border border-[#69537B] bg-background/90 px-5 py-4 shadow-glow backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-foreground/90">Player Flow</p>
                <p className="mt-2 text-base font-black text-foreground sm:text-lg">Join once, watch every reveal.</p>
              </div>
            </div>

            <div className="animate-enter-up-delay-2 mt-8 grid w-full max-w-xl grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-5">
              <BuzzerButton
                to="/admin/create"
                label="Create Game"
                icon={<Plus className="size-7 stroke-[2.5] sm:size-8" />}
                className="gradient-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              />
              <BuzzerButton
                to="/join"
                label="Join Game"
                icon={<Users className="size-6 stroke-[2.5] sm:size-7" />}
                className="bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:scale-[1.02] active:scale-[0.98]"
              />
            </div>
          </div>

          <div className="relative animate-enter-up-delay lg:justify-self-end">
            <div className="stage-panel marquee-frame rounded-[2.2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/90">Tonight's Format</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-primary">Broadcast Mode</p>
                </div>
                <div className="badge-pill flex gap-2 bg-destructive px-3 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                  <Radio className="size-3" />
                  On Air
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {showFlow.map(({ title, description, Icon }) => (
                  <div key={title} className="flex items-start gap-3 rounded-[1.6rem] bg-background/90 px-4 py-4 shadow-sm backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
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
                  <div key={stat.label} className="animate-float-slow rounded-[1.4rem] bg-primary px-4 py-4 text-center text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary-foreground/90">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10">
        <div className="mb-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-enter-up relative overflow-hidden rounded-3xl bg-card p-6 shadow-glow sm:p-8">
            <div className="pointer-events-none absolute right-0 top-0 size-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-2xl" />
            <span className="badge-pill mb-4 inline-flex bg-accent/20 px-3 text-xs font-bold uppercase tracking-wider text-accent drop-shadow-sm">
              Why It Works
            </span>
            <h2 className="mb-3 text-2xl font-black tracking-tight text-foreground sm:text-4xl">
              Survey first. Reveal later. Let the room decide the board.
            </h2>
            <p className="mb-6 max-w-lg text-sm leading-7 text-foreground/90">
              Set up custom questions, let players vote before the show, then host
              a live round on the big screen — complete with buzzers, strikes and
              a scoreboard.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureCards.map(({ title, copy, Icon }) => (
                <div key={title} className="rounded-[1.6rem] bg-background/80 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1">
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

          <div className="animate-enter-up-delay stage-panel marquee-frame flex flex-col gap-3 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground">Three Easy Steps</h3>
              <span className="badge-pill bg-background/90 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-primary">Fast Setup</span>
            </div>
            {steps.map(({ num, title, description }) => (
              <div key={num} className="flex gap-3 rounded-[1.4rem] bg-background/90 px-4 py-4 transition-transform duration-300 hover:-translate-y-1">
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
          <div className="flex min-h-36 flex-col justify-center rounded-3xl gradient-primary px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:scale-[1.02] sm:min-h-0">
            <p className="text-3xl font-black text-primary-foreground sm:text-4xl">Live</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">
              Real-time Game Play
            </p>
          </div>

          <div className="flex min-h-36 items-center gap-4 rounded-[2rem] bg-card px-6 py-5 shadow-glow transition-transform hover:scale-[1.02] sm:min-h-0">
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

          <div className="flex min-h-36 flex-col justify-center rounded-3xl bg-secondary px-6 py-5 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform hover:scale-[1.02] sm:min-h-0">
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

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="theme-panel-strong animate-enter-up rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="badge-pill mb-4 gap-2 bg-primary/10 px-3 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                <Sparkles className="size-3.5" />
                Ready For Showtime
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Start fast, keep the board clean, and let the game carry the energy.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-soft">
                Everything you need is already on the page. No extra footer menu, just the next useful moves.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {closingLinks.map(({ to, title, copy }) => (
                <Link
                  key={title}
                  to={to}
                  className="group rounded-[1.5rem] border border-border/50 bg-background/70 px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-background"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-soft">{copy}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
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
        'flex min-h-34 w-full min-w-0 flex-col items-center justify-center gap-2.5 rounded-[20px] px-3 py-5 text-center transition-all duration-150 ease-out sm:min-h-36 sm:w-44 sm:py-8',
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

const heroBadges = ['Survey Powered', 'Live Hosted', 'Game Board'];

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

const closingLinks = [
  {
    to: '/admin/create',
    title: 'Create a game',
    copy: 'Set up your questions and open the room in minutes.',
  },
  {
    to: '/join',
    title: 'Join a room',
    copy: 'Enter a code and head straight into the survey or board.',
  },
  {
    to: '/rules',
    title: 'Review the rules',
    copy: 'Refresh the format before you put the board on screen.',
  },
];
