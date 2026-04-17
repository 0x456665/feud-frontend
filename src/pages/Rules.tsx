import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageWrapper } from '@/components/layout/PageWrapper';

/**
 * Rules page — explains how to play Feud.
 * No API calls needed; purely informational.
 */
export default function Rules() {
  return (
    <PageWrapper className="max-w-2xl">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted"
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Game Rules</h1>
          <p className="text-sm text-muted-foreground">Everything you need to know to play Feud</p>
        </div>
      </div>

      <div className="space-y-4">
        {ruleSections.map(({ title, rules }, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <ol className="space-y-2">
                {rules.map((rule, j) => (
                  <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {j + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* Quick start */}
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Ready to play?
      </p>
      <div className="flex justify-center gap-3">
        <Link
          to="/admin/create"
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Create a Game
        </Link>
        <Link
          to="/join"
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Join a Game
        </Link>
      </div>
    </PageWrapper>
  );
}

// ── Rule content ───────────────────────────────────────────────────────────

const ruleSections = [
  {
    title: 'Before the Game',
    rules: [
      'The host (admin) creates a game and writes down questions for players to survey on.',
      'Players join using the game code and submit their top answers to each survey question.',
      "Once everyone has voted, the host closes voting. The server automatically ranks answers by survey popularity and assigns point values.",
      "The host then starts the game. The top-performing questions (by score distribution) are selected for the live rounds.",
    ],
  },
  {
    title: 'Playing a Round',
    rules: [
      "Each round, a question is revealed and both teams compete to name the most popular survey answers.",
      'The host reveals answers one by one — ranked tiles show the answer and its point value.',
      "A team earns a strike (✗) every time they give an answer that isn't on the board.",
      "Three strikes in a round hands control to the other team for a steal attempt.",
      'The team (or stealing team) that lands a correct answer earns all the accumulated points for that round.',
    ],
  },
  {
    title: 'Scoring',
    rules: [
      "Points for each answer are calculated from survey data: the more popular an answer, the more it's worth.",
      'The host awards points using the control panel after each correct answer.',
      'Running totals are shown live on the scoreboard for both teams.',
    ],
  },
  {
    title: 'Winning',
    rules: [
      'After all rounds are complete, the team with the most points wins.',
      "In case of a tie, Team A wins.",
      'The host can end the game at any time using the End Game button.',
    ],
  },
];
