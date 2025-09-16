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
import type { PlayerDTO, ServerPlayer, GameState } from "../types/types";


type Phase = "question" | "answer";

type ServerPlayerWire = {
  id: number;
  playerName: string;
  isHost?: boolean;  // ibland kommer det som isHost
  host?: boolean;    // ibland kommer det som host
  ready?: boolean;
  score?: number;
};

type RoundState = {
  questionId: number;
  index: number;            // 0-baserat
  total: number;            // t.ex. 5
  phase: Phase;             // "question" | "answer"
  endsAt: number;           // epoch millis när fasen tar slut
  answeredCount?: number;   // valfritt
};

// Mapper: konvertera serverns spelarmodell → UI-modell
const normalizePlayers = (arr: ServerPlayerWire[]) =>
  arr.map(p => ({
    id: p.id,
    playerName: p.playerName,
    isHost: Boolean(p.isHost ?? p.host),       // <-- nyckeln!
    ready: !!p.ready,
    score: typeof p.score === "number" ? p.score : 0,
  }));

// Mapper: konvertera serverns spelarmodell → UI-modell
const toUI = (arr: ServerPlayer[]) =>
  arr.map(p => ({
    id: String(p.id),
    playerName: p.playerName,
    score: p.score,
    isHost: p.isHost,
    ready: !!p.ready
  }));

export function useLobbySocket(
  lobbyCode: string,
  myIdStr: string,
  initialPlayers?: ServerPlayer[] | ServerPlayerWire[]
) {
  const [players, setPlayers] = useState<PlayerDTO[]>(() => {
    if (!initialPlayers) return [];
    return toUI(normalizePlayers(initialPlayers as ServerPlayerWire[]));
  });
  const [gameState, setGameState] = useState<GameState | undefined>(undefined);

  // NYTT: serverstyrd runda
  const [round, setRound] = useState<RoundState | null>(null);

  const stompRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!initialPlayers) return;
    setPlayers(toUI(normalizePlayers(initialPlayers as ServerPlayerWire[])));
  }, [initialPlayers]);

  const amHost = useMemo(
    () => players.some(p => p.isHost && String(p.id) === myIdStr),
    [players, myIdStr]
  );

  useEffect(() => {
    if (!lobbyCode) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      reconnectDelay: 1000,
      debug: (m) => import.meta.env.DEV && console.log("[STOMP]", m),
    });

    client.onConnect = () => {
      client.subscribe(TOPIC.LOBBY(lobbyCode), (frame: IMessage) => {
        if (import.meta.env.DEV) console.log("[WS] snapshot:", frame.body);

        const dto = JSON.parse(frame.body) as {
          players: ServerPlayerWire[];
          gameState?: GameState;
          round?: {
            questionId: number;
            index: number;
            total: number;
            phase: "question" | "answer";
            endsAt: number;             // du HAR redan endsAt i backend
            answeredCount?: number;
          } | null;
        };

        setPlayers(toUI(normalizePlayers(dto.players || [])));
        setGameState(dto.gameState);

        if (dto.round) {
          setRound({
            questionId: Number(dto.round.questionId),
            index: Number(dto.round.index),
            total: Number(dto.round.total),
            phase: dto.round.phase === "answer" ? "answer" : "question",
            endsAt: Number(dto.round.endsAt),
            answeredCount: typeof dto.round.answeredCount === "number" ? dto.round.answeredCount : undefined,
          });
        } else {
          setRound(null);
        }
      });
      // <-- NYTT: be servern skicka aktuell snapshot igen
      client.publish({
        destination: APP.RESYNC(lobbyCode),
        body: "{}", // inget payload behövs
        headers: { "content-type": "application/json" },
      });
    };

    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); stompRef.current = null; };
  }, [lobbyCode]);

  const publishReady = (myIdNum: number, ready: boolean) =>
    stompRef.current?.publish({
      destination: APP.READY(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum, ready }),
      headers: { "content-type": "application/json" },
    });

  const publishStart = (myIdNum: number) =>
    stompRef.current?.publish({
      destination: APP.START(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum }),
      headers: { "content-type": "application/json" },
    });

  // NYTT: skicka spelarens svar
  const publishAnswer = (payload: { playerId: number; questionId: number; option: string }) =>
    stompRef.current?.publish({
      destination: APP.ANSWER(lobbyCode),
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    });

  return { players, gameState, round, amHost, publishReady, publishStart, publishAnswer, stompRef };
}
