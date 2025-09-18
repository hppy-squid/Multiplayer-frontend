/******************************************************
 * LobbyPage
 * Sida som visar antingen:
 * - Väntvy för en specifik lobby (/lobby/:code), eller
 * - Start/Join-vy när ingen lobby är vald (/lobby)
 ******************************************************/

import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/icons";

import { createLobby, joinLobby, leaveLobby } from "../api/lobby";
import { ensurePlayer } from "../api/ensurePlayer";

import { LobbySidebar } from "../components/lobby/LobbySidebar";
import { LobbyStartPanel } from "../components/lobby/LobbyStartPanel";

import type { LobbyLocationState, ServerPlayer } from "../types/types";
import { useLobbySocket } from "../hooks/useLobbySocket";
import { useGameStartNavigation } from "../hooks/useGameStartNavigation";
import { usePlayerIdentity } from "../hooks/usePlayerIdentity";

export default function LobbyPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const location = useLocation() as { state?: LobbyLocationState };

  // Är vi i väntsidan (har kod i URL)? Annars är vi i start/join-vyn
  const isWaiting = Boolean(code);
  const lobbyCode = useMemo(() => (code ?? "").toUpperCase(), [code]);

  // Hämtar spelarens identitet (id + namn) 
  const { myIdNum, myIdStr, myName } = usePlayerIdentity(location.state);

  // ===== WebSocket via hook (inkl. initial snapshot) =====
  const initialPlayers = location.state?.initialPlayers as ServerPlayer[] | undefined;
  const { players, gameState, amHost, publishReady, publishStart, stompRef } =
    useLobbySocket(lobbyCode, myIdStr, initialPlayers);

  // ===== Navigera till spelet när servern sätter IN_GAME =====
  useGameStartNavigation(lobbyCode, {
    gameState,
    players,
    myIdNum,
    myName,
    amHost,
  });

  // ===== UI state för start/join =====
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  // Normalisera lobbykod (ta bort whitespace)
  const normalizedCode = useMemo(
    () => codeInput.replace(/\s+/g, "").trim(),
    [codeInput]
  );
  const canJoin = !submitting && normalizedCode.length > 0;

  // Kan host starta spelet?
  const MAX_PLAYERS = 4;
  const readyCount = players.filter(p => p.ready).length;
  const canStart =
    amHost &&
    gameState === "WAITING" &&
    players.length === MAX_PLAYERS &&
    readyCount === MAX_PLAYERS;

  // ===== Actions =====
  // Skapa lobby: säkerställ spelare → POST /lobby/create → navigera till /lobby/:code
  const handleCreate = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { playerId, playerName } = await ensurePlayer(name);
      const dto = await createLobby({ playerId });
      navigate(`/lobby/${dto.lobbyCode}`, {
        state: {
          isHost: true,
          playerId,
          playerName,
          initialPlayers: dto.players,
          gameState: dto.gameState,
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Okänt fel vid skapande av lobby");
    } finally {
      setSubmitting(false);
    }
  };

  // Join lobby: säkerställ spelare → POST /lobby/join → navigera till /lobby/:code
  const handleJoin = async () => {
    if (!canJoin) return;
    setSubmitting(true);
    try {
      const { playerId, playerName } = await ensurePlayer(name);
      const dto = await joinLobby({ lobbyCode: normalizedCode, playerId });
      navigate(`/lobby/${dto.lobbyCode}`, {
        state: {
          isHost: false,
          playerId,
          playerName,
          initialPlayers: dto.players,
          gameState: dto.gameState,
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunde inte gå med i lobbyn");
    } finally {
      setSubmitting(false);
    }
  };

  // Lämna lobby: POST /lobby/leave → stäng WS → navigera hem
  const handleLeave = async () => {
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

      sessionStorage.removeItem("serverPlayerId");
      sessionStorage.removeItem("serverPlayerName");
      sessionStorage.removeItem("playerId");
      sessionStorage.removeItem("playerName");

      navigate("/", { replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kunde inte lämna lobbyn");
    }
  };

  // Host startar spelet → servern broadcastar IN_GAME → hooken navigerar
  const handleStart = () => {
    if (!amHost || myIdNum == null) return;
    if (!canStart) return; // UI-säkerhet: skicka inte START om kraven inte är uppfyllda
    publishStart(myIdNum); // servern broadcastar IN_GAME → hooken ovan navigerar
  };

  // Toggle min Ready-status → invänta serverns snapshot
  const handleToggleReady = () => {
    if (myIdNum == null) return;
    const me = players.find((p) => String(p.id) === myIdStr);
    const next = !me?.ready;
    publishReady(myIdNum, next); // vi väntar på serverns /lobby/{code}-snapshot
  };

  // ===== Render =====
  // Väntsida för specifik lobby
  if (isWaiting) {
    return (
      <div className="min-h-screen flex justify-center p-6 pt-8">
        <div className="flex items-start justify-center gap-6 w-full">
          
          {/* Vänster: spelare i lobbyn */}
          <div className="w-min-80 w-max-150 shrink-0">
            <LobbySidebar
              lobbyCode={lobbyCode}
              players={players}
              myIdStr={myIdStr}
              onToggleReady={handleToggleReady}
              maxPlayers={MAX_PLAYERS}
              statusMode="ready"   
            />
          </div>

          {/* Mitten: huvudåtgärder (Start/Leave) */}
          <div className="self-start shrink-0">
            <Card className="w-[800px] h-[520px]">
              <div className="flex justify-center mb-4">
                <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
              </div>
              <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
                QUIZ GAME
              </h1>

              <div className="mt-24 flex flex-col items-center gap-4">
                <div className="w-72">
                  <Button
                    type="button"
                    onClick={handleStart}
                    className="w-full py-3 text-lg"
                    title={
                      !amHost
                        ? "Endast värden kan starta"
                        : players.length < MAX_PLAYERS
                          ? `Väntar på spelare (${players.length}/${MAX_PLAYERS})`
                          : readyCount < MAX_PLAYERS
                            ? `Väntar på redo (${readyCount}/${MAX_PLAYERS})`
                            : "Start Game"
                    }
                    disabled={!canStart}
                  >
                    {canStart ? "Start Game" : `Waiting ${Math.min(players.length, readyCount)}/${MAX_PLAYERS}`}
                  </Button>
                  <p className="mt-2 text-center text-sm text-gray-600">
                    Players: {players.length}/{MAX_PLAYERS} • Ready: {readyCount}/{MAX_PLAYERS}
                  </p>
                </div>

                <Divider />

                <div className="w-40">
                  <Button type="button" onClick={handleLeave} className="w-full">
                    Leave
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Högerspacer */}
          <div className="w-20 shrink-0" aria-hidden />
        </div>
      </div>
    );
  }

  // Start-/Join-vy (visas när ingen lobbykod finns i URL:en)
  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <Card className="w-[500px] h-[520px]">
        <div className="flex justify-center mb-4">
          <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
        </div>
        <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
          QUIZ GAME
        </h1>

        <LobbyStartPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          name={name}
          onNameChange={setName}
          codeInput={codeInput}
          onCodeChange={setCodeInput}
          submitting={submitting}
          canJoin={canJoin}
          onJoin={handleJoin}
          onCreate={handleCreate}
        />
      </Card>
    </div>
  );
}
