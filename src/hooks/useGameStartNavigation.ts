/******************************************************
 * Hook: useGameStartNavigation
 * Navigerar från lobby → game när servern signalerar IN_GAME
 ******************************************************/

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { PlayerDTO, GameState } from "../types/types";

/**
 * useGameStartNavigation
 * Hook för att automatiskt gå från lobby → game när servern sätter `IN_GAME`.
 */
export function useGameStartNavigation(
  lobbyCode: string,
  {
    gameState,
    players = [],
    myIdNum,
    myName,
    amHost,
  }: {
    gameState?: GameState;   // nuvarande spelstatus (WAITING, IN_GAME, etc.)
    players?: PlayerDTO[];   // lista över spelare i lobbyn
    myIdNum?: number;        // mitt playerId
    myName: string;          // mitt namn
    amHost: boolean;         // true om jag är host
  }
) {
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);    // skyddar mot dubbelnavigering

  useEffect(() => {
    if (gameState === "IN_GAME" && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      navigate(`/game/${lobbyCode}`, {
        state: { initialPlayers: players, playerId: myIdNum, playerName: myName, isHost: amHost },
      });
    }
  }, [gameState, players, lobbyCode, myIdNum, myName, amHost, navigate]);
}