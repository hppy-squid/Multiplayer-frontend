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

// Wire-modell av serverns spelarmodell
type ServerPlayerWire = {
  id: number;
  playerName: string;
  isHost: boolean;
  ready?: boolean;
  score?: number;
};

// Mapper: konvertera serverns spelarmodell → UI-modell
const normalizePlayers = (arr: ServerPlayerWire[]): ServerPlayer[] =>
  arr.map(p => ({
    id: p.id,
    playerName: p.playerName,
    isHost: !!p.isHost,
    ready: !!p.ready,
    score: typeof p.score === "number" ? p.score : 0,
  }));

// Mapper: konvertera serverns spelarmodell → UI-modell
const toUI = (arr: ServerPlayer[]): PlayerDTO[] =>
  arr.map(p => ({
    id: String(p.id),
    playerName: p.playerName,
    score: p.score,
    isHost: p.isHost,
    ready: !!p.ready
  }));

export function useLobbySocket(
  lobbyCode: string,              // lobbykod vi ansluter till
  myIdStr: string,                // mitt id som sträng (för amHost/You-markeringar)
  initialPlayers?: ServerPlayer[] | ServerPlayerWire[] // ev. initial snapshot vid navigation (seed)
) {
  // UI-state
  const [players, setPlayers] = useState<PlayerDTO[]>(() => {
    if (!initialPlayers) return [];
    const strict = normalizePlayers(initialPlayers as ServerPlayerWire[]);
    return toUI(strict);
  });
  const [gameState, setGameState] = useState<GameState | undefined>(undefined);
  const stompRef = useRef<Client | null>(null);



  // Seed:a om initialPlayers ändras (t.ex. efter "Play Again" → navigate med state)
  useEffect(() => {
    if (!initialPlayers) return;
    const strict = normalizePlayers(initialPlayers as ServerPlayerWire[]);
    setPlayers(toUI(strict));
  }, [initialPlayers]);

  // Är jag host? (finns en spelare som är host och vars id matchar mig)
  const amHost = useMemo(
    () => players.some(p => p.isHost && String(p.id) === myIdStr),
    [players, myIdStr]
  );

  // Skapa och anslut STOMP-klienten för denna lobby
  useEffect(() => {
    if (!lobbyCode) return;

    // Skapa STOMP-klient över SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),          // endpoint för WS
      reconnectDelay: 1000,                                 // auto-reconnect efter 1s
      debug: (m) => import.meta.env.DEV && console.log("[STOMP]", m),   // logga i dev
    });

    // När anslutningen är uppe: prenumerera på lobby-topic
    client.onConnect = () => {
      client.subscribe(TOPIC.LOBBY(lobbyCode), (frame: IMessage) => {
        // Servern pushar snapshot: { players, gameState? }
        const dto = JSON.parse(frame.body) as { players: ServerPlayerWire[]; gameState?: GameState };
        const strict = normalizePlayers(dto.players || []);
        setPlayers(toUI(strict));
        setGameState(dto.gameState);
      });
    };
    client.activate();          // starta anslutningen
    stompRef.current = client;  // spara ref för senare

    // Städa upp vid unmount/byte av lobbyCode
    return () => { client.deactivate(); stompRef.current = null; };
  }, [lobbyCode]);

  // Publicera min ready-status till servern
  const publishReady = (myIdNum: number, ready: boolean) =>
    stompRef.current?.publish({
      destination: APP.READY(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum, ready }),
      headers: { "content-type": "application/json" },
    });

  // Be servern starta spelet (endast host bör kalla denna)
  const publishStart = (myIdNum: number) =>
    stompRef.current?.publish({
      destination: APP.START(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum }),
      headers: { "content-type": "application/json" },
    });

  return { players, gameState, amHost, publishReady, publishStart, stompRef };
}
