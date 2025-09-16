/**
 * Filens syfte:
 *
 * Visa resultat (Scoreboard) efter en spelomgång med samma layout som Lobby/Quiz:
 * - Vänster: LobbySidebar med spelare
 * - Mitten: Resultat-kort med poänglista
 *
 * Funktioner:
 * - Prenumererar på lobbyn via useLobbySocket (seedas av initialPlayers via navigate-state)
 * - Play Again: skickar WS /app/lobby/{code}/resetReady, seedar ready=false och navigerar till lobbyn
 * - Back to Lobby: navigerar till lobbyn utan reset
 */

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
// import SockJS from "sockjs-client/dist/sockjs.js";
// import { Client } from "@stomp/stompjs";

import { LobbySidebar } from "../components/lobby/LobbySidebar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/icons";

import { useLobbySocket } from "../hooks/useLobbySocket";
import type { PlayerDTO, ServerPlayer } from "../types/types";
// import { WS_BASE, APP } from "../ws/endpoints";
import { resetLobbyReady, leaveLobby } from "../api/lobby";
import { usePlayerIdentity } from "../hooks/usePlayerIdentity";


// Router-state som (valfritt) kan skickas hit från spelet
type NavState = {
  lobbyCode?: string;
  players?: PlayerDTO[]; // används som seed om WS ej hunnit uppdatera
  playerId?: number;
  initialPlayers?: ServerPlayer[]; // används vid navigation till lobbyn
};


/** UI→wire: mappa PlayerDTO till ServerPlayer (seed för LobbyPage efter navigation) */
function dtoToWire(arr: PlayerDTO[]): ServerPlayer[] {
  return arr.map((p) => ({
    id: Number(p.id),
    playerName: p.playerName,
    isHost: !!p.isHost,
    ready: false, // vid "Play Again" startar alla som not ready
    score: typeof p.score === "number" ? p.score : 0,
  }));
}

export function ScoreboardPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const location = useLocation() as { state?: NavState };

  // Lobbykod: föredra URL-param (t.ex. /scoreboard/:code), annars router-state
  const lobbyCode = useMemo(
    () => (code ?? location.state?.lobbyCode ?? "").toUpperCase(),
    [code, location.state?.lobbyCode]
  );

  // Min id som sträng (för You/host-markeringar)
  const myIdStr =
    location.state?.playerId != null
      ? String(location.state.playerId)
      : sessionStorage.getItem("playerId") ?? localStorage.getItem("playerId") ?? "";

  // Seed-a från router-state om vi fick med spelare från spelet
  const initialPlayersSeed = useMemo(() => {
    const seed = location.state?.players ?? [];
    return dtoToWire(seed);
  }, [location.state?.players]);

  // Prenumerera på lobbyn (WS). Visa sidebar från live-data (fallback till seed om tomt).
  const { players: livePlayers } = useLobbySocket(
    lobbyCode,
    myIdStr,
    initialPlayersSeed
  );

  // Spelare att visa i UI (sidebar + resultattabell)
  const playersForUI: PlayerDTO[] = livePlayers.length
    ? livePlayers
    : (location.state?.players ?? []);

  // Sortera resultat (högst poäng först)
  const sorted = [...playersForUI].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );

  const MAX_PLAYERS = 4;
  const noop = () => {};

  // ===== Actions =====


// Reset allas ready i lobbyn, navigera sedan till lobbyn
  const handlePlayAgain = async () => {
    
    const me = playersForUI.find(p => String(p.id) === myIdStr);
    const isHost = me?.isHost;

    if (!isHost) {
      navigate(`/lobby/${lobbyCode}`, {
        replace: true,
        state: {
          initialPlayers: dtoToWire(playersForUI),
          playerId: Number(myIdStr) || undefined,
        },
      });
      return;
    }
    
    try {
      await resetLobbyReady(lobbyCode);
    } catch (e) {
      alert("Play Again misslyckades: " + (e instanceof Error ? e.message : String(e)));
      return;
    }
    navigate(`/lobby/${lobbyCode}`, {
      replace: true,
      state: {
        playerId: Number(myIdStr) || undefined,
      },
    });
  };
  

  // Lämna lobbyn
  const handleLeave = async () => {

    const isWaiting = Boolean(code); 
    const initialPlayers = location.state?.initialPlayers as ServerPlayer[] | undefined;
    const { myIdNum, myIdStr } = usePlayerIdentity(location.state);
    const {  stompRef } = useLobbySocket(lobbyCode, myIdStr, initialPlayers);
    
    if (!isWaiting) {
      navigate("/", { replace: true });
      return;
    }
    if (myIdNum == null) {
      alert("Saknar giltigt playerId.");
      return;
    }
    try {
      await leaveLobby({ lobbyCode, playerId: myIdNum });
      await stompRef.current?.deactivate().catch(() => undefined);
      navigate("/", { replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kunde inte lämna lobbyn");
    }
  };

  // ===== Render =====

  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <div className="flex items-start justify-center gap-6 w-full">
        {/* Vänster: spelare */}
        <div className="w-80 shrink-0">
          <LobbySidebar
            lobbyCode={lobbyCode}
            players={playersForUI}
            myIdStr={myIdStr}
            onToggleReady={noop}
            maxPlayers={MAX_PLAYERS}
          />
        </div>

        {/* Mitten: Resultat-kort */}
        <div className="self-start shrink-0">
          <Card className="w-[800px]">
            {/* Ikon/header */}
            <div className="flex justify-center mb-4">
              <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
            </div>

            <h1 className="text-3xl font-bold text-center tracking-wider text-gray-900 mb-6">
              SCOREBOARD
            </h1>

            {/* Topplista */}
            <div className="mb-4">
              {sorted.length === 0 ? (
                <p className="text-center text-gray-600">
                  Inga resultat att visa ännu.
                </p>
              ) : (
                <ul className="divide-y rounded-xl border bg-white">
                  {sorted.map((p, i) => {
                    const rank = i + 1;
                    const isMe = String(p.id) === myIdStr;
                    const badge =
                      rank === 1
                        ? "bg-yellow-200 text-yellow-900"
                        : rank === 2
                        ? "bg-gray-200 text-gray-700"
                        : rank === 3
                        ? "bg-orange-200 text-orange-900"
                        : "bg-gray-100 text-gray-700";
                    return (
                      <li
                        key={`${p.id}-${i}`}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-semibold ${badge}`}
                            aria-label={`Placering ${rank}`}
                          >
                            {rank}
                          </span>
                          <span className={`truncate font-medium ${isMe ? "underline" : ""}`}>
                            {p.playerName}
                          </span>
                          {p.isHost && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-700">
                              Host
                            </span>
                          )}
                          {isMe && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-blue-300 text-blue-700">
                              You
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-semibold tabular-nums">
                            {p.score ?? 0}
                          </span>
                          <span className="ml-1 text-sm text-gray-600">pts</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Divider className="my-6" />

            {/* Åtgärder */}
            <div className="mb-4 flex items-center justify-center gap-4">
              <Button className="w-40" onClick={handlePlayAgain} disabled={!lobbyCode}>
                Play Again
              </Button>
              <Button className="w-40" onClick={handleLeave}>
                Leave
              </Button>
            </div>
          </Card>
        </div>

        {/* Högerspacer */}
        <div className="w-20 shrink-0" aria-hidden />
      </div>
    </div>
  );
}


