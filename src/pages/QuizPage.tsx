/**
 * Filens syfte (uppdaterad):
 *
 * Denna sida (`QuizPage`) visar quizet för en specifik lobby och använder nu
 * hooken `useLobbySocket` för all WS-kommunikation
 * - Läser lobbykoden från URL.
 * - Läser (valfritt) initialPlayers + playerId från router state.
 * - Använder `useLobbySocket(lobbyCode, myIdStr, initialPlayers)` för att få players och publishReady.
 * - Renderar: vänster (LobbySidebar), mitten (Quiz-kort med timer, progress, frågor).
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import { Card } from "../components/ui/Card";
import { QuizTime } from "../components/ui/QuizTime";
import { Questions } from "../components/ui/Questions";
import { LobbySidebar } from "../components/lobby/LobbySidebar";

import { useLobbySocket } from "../hooks/useLobbySocket";
import type { PlayerDTO, ServerPlayer } from "../types/types";
import { GroupIcon } from "../components/icons";

// Typ för state som kan skickas med via navigate(...) från LobbyPage
type NavState = {
  initialPlayers?: ServerPlayer[];
  playerId?: number;
  playerName?: string;
  isHost?: boolean;
};

export function QuizPage() {
  // Plocka lobbykod från URL och normalisera till UPPERCASE
  const { code } = useParams<{ code: string }>();
  const lobbyCode = useMemo(() => (code ?? "").toUpperCase(), [code]);

  const location = useLocation() as { state?: NavState };

  // Bestäm mitt id som sträng: router state → session → local
  const myIdStr = (location.state?.playerId != null
    ? String(location.state.playerId)
    : sessionStorage.getItem("playerId") ?? localStorage.getItem("playerId") ?? "");

  // Seed:a socket-hooken med initial snapshot om vi fick med det från navigate(...)
  const initialPlayers = location.state?.initialPlayers;

  // Använd socket-hooken
  const { players, publishReady } = useLobbySocket(
    lobbyCode,
    myIdStr,
    initialPlayers
  );

  // Klick på "Ready" i sidbaren → toggla min status och skicka till servern
  const handleToggleReady = () => {
    const myIdNum = Number(myIdStr);
    if (!myIdNum || Number.isNaN(myIdNum)) {
      alert("Saknar giltigt playerId – gå med i lobbyn först.");
      return;
    }
    const me = players.find((p: PlayerDTO) => String(p.id) === myIdStr);
    const nextReady = !me?.ready;
    publishReady?.(myIdNum, nextReady);
  };

  const navigate = useNavigate();
  const didGoScoreboard = useRef(false);

  // --- Progress: 5 frågor ---
  const TOTAL_QUESTIONS = 5;
  const [answered, setAnswered] = useState(0); // hur många frågor passerade
  const progress = Math.round((answered / TOTAL_QUESTIONS) * 100); // 0% → 100%
  const handleProgressChange = useCallback((count: number) => {
  setAnswered(count);
}, []);

  const goToScoreboard = () => {
    if (didGoScoreboard.current) return;
    didGoScoreboard.current = true;
    navigate(`/lobby/${lobbyCode}/scoreboard`, {
      replace: true,
      state: { lobbyCode, players, playerId: Number(myIdStr) }, 
    });
  };

  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <div className="flex items-start justify-center gap-6 w-full">
        {/* Vänster: spelare i lobbyn */}
        <div className="w-80 shrink-0">
          <LobbySidebar
            lobbyCode={lobbyCode}
            players={players}
            myIdStr={myIdStr}
            onToggleReady={handleToggleReady}
            maxPlayers={4}
          />
        </div>

        {/* Mitten: quiz-kort */}
        <div className="self-start shrink-0">
          <Card className="w-[800px] h-[700px]">
            {/* Ikon/header */}
            <div className="flex justify-center mb-4">
              <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
            </div>

            {/* Titel + timer */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
                QUIZ GAME
              </h1>
              <QuizTime />
            </div>

            {/* Progress meta */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Fråga {Math.min(answered + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</span>
              <span>{progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-gray-200 mb-6">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${progress}%` }}
                className="flex h-full bg-blue-500 transition-all"
              />
            </div>

            {/* Frågor + svarsalternativ
                Questions anropar onProgressChange(answeredCount, total)
                när användaren går vidare till nästa fråga. */}
            <Questions
              total={TOTAL_QUESTIONS}
              onProgressChange={handleProgressChange}
              onComplete={goToScoreboard}
            />
          </Card>
        </div>

        {/* Högerspacer */}
        <div className="w-20 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
