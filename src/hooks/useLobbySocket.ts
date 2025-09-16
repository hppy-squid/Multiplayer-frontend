/**
 * Filens syfte:
 *
 * Denna fil innehåller hooken `useLobbySocket` som hanterar WebSocket-kommunikation för en lobby.
 * - Skapar en STOMP-klient över SockJS mot backend (WS_BASE).
 * - Prenumererar på lobby-topic för att ta emot uppdateringar (spelare + gameState).
 * - Publicerar meddelanden för Ready/Start till servern.
 * - Seedar UI-state med `initialPlayers` (om vi navigerar in med befintlig snapshot).
 *
 * Returnerar:
 * - players: PlayerDTO[] (UI-modell)
 * - gameState: nuvarande spelstatus (WAITING/IN_GAME/etc.)
 * - amHost: boolean (om jag är host)
 * - publishReady: (myIdNum, ready) → skickar min ready-status
 * - publishStart: (myIdNum) → ber servern starta spelet
 * - stompRef: ref till STOMP-klienten (för t.ex. manuell deactivate vid unmount)
 */

import { useEffect, useRef, useState, useMemo } from "react";
import SockJS from "sockjs-client/dist/sockjs.js";
import { Client, type IMessage } from "@stomp/stompjs";
import { WS_BASE, APP, TOPIC } from "../ws/endpoints";
import type { PlayerDTO, GameState, RoundState } from "../types/types";

/** Serverns PlayerWire enligt LobbySnapshotDTO (backend) */
type ServerPlayerWire = {
  id: number | string;
  playerName: string;
  isHost?: boolean;
  host?: boolean;          // fallback om backend skulle heta "host"
  ready?: boolean;
  score?: number;
  answered?: boolean;      // från backend
  correct?: boolean | null;// från backend (true/false/null)
};

/** Serverns RoundDTO enligt LobbySnapshotDTO (backend) */
type ServerRoundDTO = {
  questionId: number | string;
  index: number;
  total: number;
  phase: "question" | "answer";
  endsAt: number | string;      // epoch millis
  answeredCount?: number | null;
};

/** Payload som kommer via /lobby/{code} */
type SnapshotWire = {
  players: ServerPlayerWire[];
  gameState?: GameState;
  round?: ServerRoundDTO | null;
};

/** Normalisera en spelare från backend → vår UI-typ */
function normalizePlayer(p: ServerPlayerWire): PlayerDTO {
  return {
    id: Number(p.id),
    playerName: p.playerName,
    isHost: Boolean(p.isHost ?? p.host),
    ready: !!p.ready,
    score: typeof p.score === "number" ? p.score : 0,
    answered: !!p.answered,
    correct: p.correct ?? null,
  };
}

/** Normalisera en lista (tål undefined/null) */
function normalizePlayers(arr?: ServerPlayerWire[] | null): PlayerDTO[] {
  return (arr ?? []).map(normalizePlayer);
}

export function useLobbySocket(
  lobbyCode: string,
  myIdStr: string,
  initialPlayers?: ServerPlayerWire[] // kan komma från navigation state
) {
  const [players, setPlayers] = useState<PlayerDTO[]>(
    () => normalizePlayers(initialPlayers)
  );
  const [gameState, setGameState] = useState<GameState | undefined>(undefined);
  const [round, setRound] = useState<RoundState | null>(null);

  const stompRef = useRef<Client | null>(null);

  // Seeda från initialPlayers om vi fått med oss snapshot vid navigering
  useEffect(() => {
    if (initialPlayers) setPlayers(normalizePlayers(initialPlayers));
  }, [initialPlayers]);

  const amHost = useMemo(() => {
    const myIdNum = Number(myIdStr);
    return players.some(p => p.isHost && p.id === myIdNum);
  }, [players, myIdStr]);

  useEffect(() => {
    if (!lobbyCode) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      reconnectDelay: 1000,
      debug: (m) => import.meta.env.DEV && console.log("[STOMP]", m),
    });

    client.onConnect = () => {
      // Lyssna på snapshotar för den här lobbyn
      client.subscribe(TOPIC.LOBBY(lobbyCode), (frame: IMessage) => {
        const dto = JSON.parse(frame.body) as SnapshotWire;

        // Players
        setPlayers(normalizePlayers(dto.players));

        // GameState
        setGameState(dto.gameState);

        // Round
        if (dto.round) {
          setRound({
            questionId: Number(dto.round.questionId),
            index: Number(dto.round.index),
            total: Number(dto.round.total),
            phase: dto.round.phase === "answer" ? "answer" : "question",
            endsAt: Number(dto.round.endsAt),
            answeredCount:
              typeof dto.round.answeredCount === "number" && !Number.isNaN(dto.round.answeredCount)
                ? dto.round.answeredCount
                : 0,
          });
        } else {
          setRound(null);
        }
      });

      // Be servern skicka aktuell snapshot direkt
      client.publish({
        destination: APP.RESYNC(lobbyCode),
        body: "{}", // inget payload behövs
        headers: { "content-type": "application/json" },
      });
    };

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [lobbyCode]);

  // Publicera "ready"
  const publishReady = (myIdNum: number, ready: boolean) =>
    stompRef.current?.publish({
      destination: APP.READY(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum, ready }),
      headers: { "content-type": "application/json" },
    });

  // Starta spelet
  const publishStart = (myIdNum: number) =>
    stompRef.current?.publish({
      destination: APP.START(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum }),
      headers: { "content-type": "application/json" },
    });

  // Skicka svar
  const publishAnswer = (payload: { playerId: number; questionId: number; option: string }) =>
    stompRef.current?.publish({
      destination: APP.ANSWER(lobbyCode),
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    });

  return { players, gameState, round, amHost, publishReady, publishStart, publishAnswer, stompRef };
}
