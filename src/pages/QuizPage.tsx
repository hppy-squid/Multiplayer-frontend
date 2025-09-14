import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import SockJS from "sockjs-client/dist/sockjs.js";
import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";

import { Card } from "../components/ui/Card";
import { QuizTime } from "../components/ui/QuizTime";
import { Questions } from "../components/ui/Questions";
import { LobbySidebar } from "../components/lobby/LobbySidebar";

import { WS_BASE, TOPIC, APP } from "../ws/endpoints";
import type { PlayerDTO, ServerPlayer, GameState } from "../types/types";
import GroupIcon from "@mui/icons-material/Group";

// Typ för state som skickas med via navigate (från LobbyPage)
type NavState = {
  initialPlayers?: PlayerDTO[];
  playerId?: number;
  playerName?: string;
  isHost?: boolean;
};

// Sidan för att spela quiz
export function QuizPage() {
  const { code } = useParams<{ code: string }>();
  const lobbyCode = useMemo(() => (code ?? "").toUpperCase(), [code]);

  // === UI state ===
  const location = useLocation() as { state?: NavState };

  // Hämta mitt playerId från sessionStorage eller localStorage
  const storedIdStr =
    sessionStorage.getItem("playerId") ?? localStorage.getItem("playerId") ?? "";
  const myIdStr = storedIdStr;

  // Lista med spelare (från WS)
  const [players, setPlayers] = useState<PlayerDTO[]>(
    () => location.state?.initialPlayers ?? []
  );

  // STOMP-klient (behålls mellan renders)
  const stompRef = useRef<Client | null>(null);

  // Hjälpfunktion för att mappa ServerPlayer → PlayerDTO
  const toUI = (arr: ServerPlayer[]): PlayerDTO[] =>
    arr.map((p) => ({
      id: String(p.id),
      playerName: p.playerName,
      score: p.score,
      isHost: p.isHost,
      ready: !!p.ready,
    }));

  // prenumerera på lobby-snapshot via WS
  useEffect(() => {
    if (!lobbyCode) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      reconnectDelay: 1000,
      debug: (msg) => {
        if (import.meta.env.DEV) console.log("[STOMP]", msg);
      },
    });

    // Prenumerera på lobby-topic
    client.onConnect = () => {
      client.subscribe(TOPIC.LOBBY(lobbyCode), (frame: IMessage) => {
        const dto = JSON.parse(frame.body) as {
          players: ServerPlayer[];
          gameState?: GameState;
        };
        setPlayers(toUI(dto.players));
      });
    };

    // Starta WS-klient
    client.activate();
    stompRef.current = client;

    // Avsluta WS vid unmount
    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [lobbyCode]);

  // Klick på Ready-knappen
  const handleToggleReady = () => {
    const myIdNum = Number(myIdStr);
    // Säkerställ att vi har ett giltigt id
    if (!myIdNum || Number.isNaN(myIdNum)) {
      alert("Saknar giltigt playerId – gå med i lobbyn först.");
      return;
    }
    // Hitta mig i listan och toggla ready
    const me = players.find((p) => String(p.id) === myIdStr);
    const nextReady = !me?.ready;

    // Skicka meddelande till servern
    stompRef.current?.publish({
      destination: APP.READY(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum, ready: nextReady }),
      headers: { "content-type": "application/json" },
    });
  };

  // === Render ===
  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <div className="flex items-start justify-center gap-6 w-full">

        {/* Vänster: Lobbymembers*/}
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
            <div className="flex justify-center mb-4">
              <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
                QUIZ GAME
              </h1>
              <QuizTime />
            </div>

            {/* Progress bar */}
            <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-gray-200 mb-6">
              <div
                role="progressbar"
                aria-valuenow={15}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: "15%" }}
                className="flex h-full bg-blue-500"
              />
            </div>

            <Questions />
          </Card>
        </div>

        {/* Högerspacer */}
        <div className="w-20 shrink-0" aria-hidden />
      </div>
    </div>
  );
}