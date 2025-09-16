/**
 * Filens syfte:
 *
 * Denna sida visar resultat (Scoreboard) efter en spelomgång.
 * - Ersätter tidigare `LobbyMembers` med den dynamiska `LobbySidebar`.
 * - Tar emot (valfritt) router state med lobbykod, spelare och mitt id.
 * - Visar två knappar: "Spela igen" och "Tillbaka till lobbyn".
 *
 * Notis:
 * - `LobbySidebar` kräver props: lobbyCode, players, myIdStr, onToggleReady.
 * - På en scoreboard-vy behöver vi normalt inte ändra "ready", så vi skickar en no-op.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { LobbySidebar } from "../components/lobby/LobbySidebar";
import { Button } from "../components/ui/Button";
import type { PlayerDTO } from "../types/types";
import { resetLobbyReady } from "../api/lobby";

// Router-state som (valfritt) kan skickas hit från spelet
type NavState = {
  lobbyCode?: string;
  players?: PlayerDTO[];
  playerId?: number;
};

export function ScoreboardPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: NavState };

  // Plocka data från router state (fallbacks om inget skickats)
  const lobbyCode = (location.state?.lobbyCode ?? "").toUpperCase();
  const players: PlayerDTO[] = location.state?.players ?? [];
  const myIdStr = location.state?.playerId != null ? String(location.state.playerId) : "";

  // Ingen "ready" på scoreboard → no-op
  const noop = () => {};

  // Mapper: konvertera UI-modell → serverns spelarmodell
  const toWirePlayers = (arr: PlayerDTO[]) =>
    arr.map(p => ({
      id: Number(p.id),
      playerName: p.playerName,
      isHost: !!p.isHost,
      ready: false,                                
      score: typeof p.score === "number" ? p.score : 0,
    }));


  // Navigation för knappar
  const handlePlayAgain = async () => {
    if (!lobbyCode) { navigate("/lobby"); return; }

    try {
      await resetLobbyReady(lobbyCode);          
    } catch (e) {
      
      console.warn(e);
    }

    navigate(`/lobby/${lobbyCode}`, {
      replace: true,
      state: {
        initialPlayers: toWirePlayers(players),   
        playerId: Number(myIdStr) || undefined,
      },
    });
  };

  const handleBackToLobby = () => {
    if (lobbyCode) navigate(`/lobby/${lobbyCode}`);
    else navigate("/lobby");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Titel */}
      <h1 className="text-8xl font-bold mb-24">Scoreboard</h1>

      {/* Spelare/resultat via LobbySidebar (ersätter LobbyMembers) */}
      <div>
        <LobbySidebar
          lobbyCode={lobbyCode}
          players={players}
          myIdStr={myIdStr}
          onToggleReady={noop}
          maxPlayers={4}
        />
      </div>

      {/* Åtgärder */}
      <div className="mt-8 flex gap-4">
        <Button className="w-full max-w-xs" onClick={handlePlayAgain}>
          Play Again
        </Button>
        <Button className="w-full max-w-xs" onClick={handleBackToLobby}>
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}