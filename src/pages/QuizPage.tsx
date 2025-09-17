/**
 * QuizPage: visar quiz i en lobby. Fråga/phase/timer styrs av serverns round.
 */
import { useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import { Card } from "../components/ui/Card";
import { QuizTime } from "../components/ui/QuizTime";
import { QuestionsControlled } from "../components/ui/QuestionsControlled";
import { LobbySidebar } from "../components/lobby/LobbySidebar";
import { GroupIcon } from "../components/icons";

import { useLobbySocket } from "../hooks/useLobbySocket";
import type { ServerPlayer } from "../types/types";

type NavState = {
  initialPlayers?: ServerPlayer[];
  playerId?: number;
  playerName?: string;
  isHost?: boolean;
};

export function QuizPage() {
  const { code } = useParams<{ code: string }>();
  const lobbyCode = useMemo(() => (code ?? "").toUpperCase(), [code]);
  const location = useLocation() as { state?: NavState };

  const myIdStr =
    location.state?.playerId != null
      ? String(location.state.playerId)
      : sessionStorage.getItem("playerId") ??
      localStorage.getItem("playerId") ??
      "";

  const initialPlayers = location.state?.initialPlayers;

  const { players, gameState, round, publishAnswer } = useLobbySocket(
    lobbyCode,
    myIdStr,
    initialPlayers
  );

 
  const handleAnswer = useCallback(
    (opt: string) => {
      if (!round) return;
      const myIdNum = Number(myIdStr);
      if (!myIdNum || Number.isNaN(myIdNum)) return;
      publishAnswer({ playerId: myIdNum, questionId: round.questionId, option: opt });
    },
    [publishAnswer, round, myIdStr]
  );

  const navigate = useNavigate();
  const didGoScoreboard = useRef(false);
  useEffect(() => {
    if (didGoScoreboard.current) return;
    if (gameState === "FINISHED") {
      didGoScoreboard.current = true;
      navigate(`/lobby/${lobbyCode}/scoreboard`, {
        replace: true,
        state: { lobbyCode, players, playerId: Number(myIdStr) || undefined },
      });
    }
  }, [gameState, lobbyCode, navigate, players, myIdStr]);

  useEffect(() => {
    // nollställ när det blir ny fråga (eller när phase går tillbaka till "question")
    // setIAnswered(false);
  }, [round?.questionId, round?.phase]);

  // progress → fyller frågan först i reveal-fasen
  const progressPct = (() => {
    if (!round) return 0;
    const filled = round.index + (round.phase === "answer" ? 1 : 0);
    return Math.min(100, Math.round((filled / round.total) * 100));
  })();

  const noop = () => {};

  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <div className="flex items-start justify-center gap-6 w-full">
        {/* Vänster: spelare */}
        <div className="w-min-80 w-max-150 shrink-0">
          <LobbySidebar
            lobbyCode={lobbyCode}
            players={players}
            myIdStr={myIdStr}
            onToggleReady={noop}
            maxPlayers={4}
            statusMode="answered"           
          />
        </div>

        {/* Mitten */}
        <div className="self-start shrink-0">
          <Card className="w-[800px]">
            <div className="flex justify-center mb-4">
              <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
                QUIZ GAME
              </h1>
              {round ? (
                <QuizTime phase={round.phase} endsAt={round.endsAt} />
              ) : (
                <div className="text-sm text-gray-600">Waiting…</div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {round ? Math.min(round.index + 1, round.total) : 0}/{round?.total ?? 5}
              </span>
              <span>{progressPct}%</span>
            </div>

            <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-gray-200 mb-6">
              <div
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${progressPct}%` }}
                className="flex h-full bg-blue-500 transition-all"
              />
            </div>

            {round ? (
              <QuestionsControlled
                questionId={round.questionId}
                index={round.index}
                total={round.total}
                phase={round.phase}
                onAnswer={handleAnswer}
              // answeredCount={round.answeredCount}
              />
            ) : (
              <div className="text-center text-gray-600">Next question is on its way…</div>
            )}
          </Card>
        </div>

        <div className="w-20 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
