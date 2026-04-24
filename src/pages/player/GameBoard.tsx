import { useCallback, useEffect } from "react"
import type { ReactNode } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { Loader2, Radio, Trophy, Tv2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnswerTile } from "@/components/game/AnswerTile"
import { StrikeMarks } from "@/components/game/StrikeMarks"
import { TeamScoreCard } from "@/components/game/TeamScoreCard"
import { useGameEvents } from "@/hooks/useGameEvents"
import { useGetBoardQuery } from "@/store/api/playerApi"
import { applyBoardSnapshot } from "@/store/slices/gameStateSlice"
import { unlockAudio } from "@/lib/sound"
import type { RootState, AppDispatch } from "@/store"

export default function GameBoard() {
  const { gameCode = "" } = useParams<{ gameCode: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const {
    teamAName,
    teamBName,
    teamAScore,
    teamBScore,
    currentQuestion,
    revealedTiles,
    currentStrikes,
    playState,
    winner,
  } = useSelector((s: RootState) => s.gameState)

  const { data: board, refetch: refetchBoard } = useGetBoardQuery(gameCode)

  // Unlock browser autoplay policy on first user interaction so SSE sounds work
  useEffect(() => {
    const unlock = () => { unlockAudio(); }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  useEffect(() => {
    if (!board) return
    dispatch(applyBoardSnapshot(board))
  }, [board, dispatch])

  const handleDisconnect = useCallback(async () => {
    try {
      const snapshot = await refetchBoard().unwrap()
      dispatch(applyBoardSnapshot(snapshot))
    } catch {
      // Silent retry; the SSE hook will keep reconnecting.
    }
  }, [refetchBoard, dispatch])

  useGameEvents(gameCode, handleDisconnect)

  const tiles = Array.from(
    { length: currentQuestion?.totalOptions ?? 0 },
    (_, index) => {
      const rank = index + 1
      const revealed = revealedTiles.find((tile) => tile.rank === rank)
      return { rank, revealed }
    }
  )
  const tileColumns = tiles.length > 3 ? 2 : 1

  if (playState === "FINISHED" || winner) {
    return (
      <FullScreenBoard gameCode={gameCode}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="marquee-frame theme-panel-strong shadow-glow rounded-[2.6rem] px-6 py-10 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Trophy className="size-10" />
            </div>
            <h2 className="mt-5 text-4xl font-extrabold text-foreground">
              Game Over!
            </h2>
            <p className="mt-2 text-xl font-semibold text-foreground/80">
              Winner:{" "}
              <span className="text-primary">{winner?.teamName ?? "—"}</span>
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-background/85 px-5 py-5 shadow-sm">
                <div className="text-sm text-muted-foreground">{teamAName}</div>
                <div className="mt-2 text-4xl font-black text-primary">
                  {winner?.teamATotal ?? teamAScore}
                </div>
              </div>
              <div className="rounded-[1.75rem] bg-background/85 px-5 py-5 shadow-sm">
                <div className="text-sm text-muted-foreground">{teamBName}</div>
                <div className="mt-2 text-4xl font-black text-primary">
                  {winner?.teamBTotal ?? teamBScore}
                </div>
              </div>
            </div>
            <Button
              className="mt-8 rounded-full px-8"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
          </div>
        </div>
      </FullScreenBoard>
    )
  }

  if (!currentQuestion) {
    return (
      <FullScreenBoard gameCode={gameCode}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="marquee-frame theme-panel-strong shadow-glow flex flex-col items-center justify-center gap-4 rounded-[2.6rem] px-6 py-16 text-center">
            <Loader2 className="size-12 animate-spin text-primary" />
            <h2 className="text-3xl font-black text-foreground">
              Waiting for the game to start…
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              The board is ready. As soon as the host starts the round, this
              page will switch into the active question automatically.
            </p>
          </div>
        </div>
      </FullScreenBoard>
    )
  }

  return (
    <FullScreenBoard gameCode={gameCode}>
      <div className="mx-auto grid h-full w-full max-w-384 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(0.7rem,1.5vh,1rem)] px-[2.5vw] py-[2.2vh] sm:px-[2vw] lg:grid-rows-[32%_minmax(0,1fr)] lg:px-[1.6vw]">
        <div className="grid min-h-0 grid-cols-2 items-stretch gap-[clamp(0.7rem,1vw,1rem)] lg:grid-cols-[21%_58%_21%]">
          <TeamScoreCard
            teamName={teamAName}
            score={teamAScore}
            className="order-2 text-center lg:order-0"
          />

          <div className="marquee-frame theme-panel-strong shadow-glow order-1 col-span-2 flex min-h-0 flex-col justify-center rounded-[1.7rem] px-[4.5%] py-[5%] text-center lg:order-0 lg:col-span-1 lg:rounded-[2.15rem]">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary">
                Round {currentQuestion.roundNumber}
              </Badge>
              <span className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-[10px] font-black tracking-[0.22em] text-white uppercase">
                <Radio className="size-3" />
                Live Board
              </span>
            </div>
            <h1 className="mx-auto mt-[4%] max-w-[92%] text-[clamp(1.35rem,2.7vw,2.7rem)] leading-[1.04] font-black text-foreground">
              {currentQuestion.text}
            </h1>
            <div className="mt-[4.5%] flex justify-center">
              <StrikeMarks count={currentStrikes} />
            </div>
          </div>

          <TeamScoreCard
            teamName={teamBName}
            score={teamBScore}
            className="order-3 text-center lg:order-0"
          />
        </div>

        <div className="min-h-0">
          <div
            className="grid h-full min-h-0 auto-rows-fr gap-[clamp(0.7rem,1.1vh,1rem)]"
            style={{
              gridTemplateColumns: `repeat(${tileColumns}, minmax(0, 1fr))`,
            }}
          >
            {tiles.map(({ rank, revealed }) => (
              <AnswerTile
                key={rank}
                rank={rank}
                revealed={!!revealed}
                optionText={revealed?.optionText}
                points={revealed?.points}
                className="aspect-[8/1.7] min-h-0"
              />
            ))}
          </div>
        </div>
      </div>
    </FullScreenBoard>
  )
}

function FullScreenBoard({
  children,
  gameCode,
}: {
  children: ReactNode
  gameCode: string
}) {
  return (
    <div className="stage-grid spotlight-wash flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="shrink-0 border-b border-border/40 bg-background/88 backdrop-blur-sm">
        <div className="mx-auto flex max-w-384 items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-black text-primary">
            <Tv2 className="size-4" />
            Feud Board
          </div>
          <span className="rounded-full border border-border/60 bg-card/90 px-3 py-1 font-mono text-xs text-foreground shadow-sm">
            {gameCode}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
