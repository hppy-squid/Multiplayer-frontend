import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { TabList } from "../components/ui/TabList";
import { TabButton } from "../components/ui/TabButton";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/icons";

import {
  createLobby,
  joinLobby,
  isBackendConfigured,
  BACKEND_NOT_ENABLED_MSG,
  FIXED_MAX_PLAYERS,
} from "../api/lobby";

import { ensurePlayer } from "../api/ensurePlayer";
import type { PlayerDTO } from "../types";

export default function LobbyPage() {
  const navigate = useNavigate();
  // Läs lobbykod från URL (om vi redan är i väntrummet)
  const { code } = useParams<{ code: string }>();

  // Data som skickats via navigate(..., { state: {...} })
  const location = useLocation() as {
    state?: { isHost?: boolean; playerId?: string; playerName?: string };
  };

  // === Mode: waiting om :code finns ===
  const isWaiting = Boolean(code);
  const lobbyCode = useMemo(() => (code ?? "").toUpperCase(), [code]);

  // === Delad state för Join/Create ===
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const normalizedCode = useMemo(
    () => codeInput.replace(/\s+/g, "").trim(),
    [codeInput]
  );

  // Dev-test: enkel testkod som fungerar utan backend
  const TEST_CODE = (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";
  const TEST_MODE = import.meta.env.DEV && !isBackendConfigured;

  // När kan man trycka "Join"?
  const canJoin =
    !submitting &&
    (TEST_MODE ? normalizedCode === TEST_CODE : normalizedCode.length > 0);

  // === Stabil spelidentitet (gäller både join/create och waiting) ===
  // Hämta id/namn från state -> session -> local -> fallback
  const myId =
    location.state?.playerId ??
    sessionStorage.getItem("playerId") ??
    localStorage.getItem("playerId") ??
    crypto.randomUUID();

  const myName = (
    location.state?.playerName ??
    sessionStorage.getItem("playerName") ??
    localStorage.getItem("playerName") ??
    name ??
    "Player"
  )
    .toString()
    .trim();

  const amHost = Boolean(location.state?.isHost);

  // Om vi landar direkt på /lobby/:code utan state — skriv identitet till sessionStorage
  useEffect(() => {
    if (!sessionStorage.getItem("playerId")) sessionStorage.setItem("playerId", myId);
    if (!sessionStorage.getItem("playerName")) sessionStorage.setItem("playerName", myName);
  }, [myId, myName]);

  // === Players: starta tomt; när vi är i waiting, lägg till "mig" om jag saknas ===
  const [players, setPlayers] = useState<PlayerDTO[]>([]);

  useEffect(() => {
    if (!isWaiting) return;

    setPlayers((prev) => {
      // Redan med? Låt listan vara.
      if (prev.some((p) => p.id === myId)) return prev; 
      // Annars lägg in mig som första spelare
      const me: PlayerDTO = {
        id: myId,
        playerName: myName,
        score: 0,
        isHost: amHost,
        ready: false,
      };
      return [me, ...prev];
    });
  }, [isWaiting, lobbyCode, myId, myName, amHost]);

  // === Actions: Create (skapa ny lobby som host) ===
  const handleCreate = async () => {
    if (!isBackendConfigured || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      // Säkerställ att vi har playerId/playerName i sessionStorage
      const { playerId, playerName } = await ensurePlayer(name); 
      // Skapa lobby och navigera till väntrummet som host
      const { lobbyCode } = await createLobby({ hostName: playerName });
      navigate(`/lobby/${lobbyCode}`, {
        state: { isHost: true, playerId, playerName },
      });
    } catch (err) {
      console.error(err);
      alert(BACKEND_NOT_ENABLED_MSG);
    } finally {
      setSubmitting(false);
    }
  };

  // === Actions: Join (gå med i befintlig lobby) ===
  const handleJoin = async () => {
    if (!canJoin) return;
    setSubmitting(true);
    try {
      // Säkerställ identitet först
      const { playerId, playerName } = await ensurePlayer(name); 

      // Dev-läge: hoppa över backend om koden matchar testkod
      if (TEST_MODE && normalizedCode === TEST_CODE) {
        await new Promise((r) => setTimeout(r, 120));
        navigate(`/lobby/${TEST_CODE}`, {
          state: { isHost: false, playerId, playerName },
        });
        return;
      }

      // Prod-läge: anropa backend
      const { lobbyCode } = await joinLobby({
        lobbyCode: normalizedCode,
        playerName,
      });
      // In i väntrummet
      navigate(`/lobby/${lobbyCode}`, {
        state: { isHost: false, playerId, playerName },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : BACKEND_NOT_ENABLED_MSG;
      console.error(err);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  // === Actions: Waiting (när vi redan är i väntrummet) ===
  const handleLeave = () => navigate("/", { replace: true });   // tillbaka till start
  const handleStart = () => {
    if (!amHost) return;   // bara host får starta
    navigate(`/game/${lobbyCode}`, { state: { fromWaitingRoom: true } });
  };

  // Ready-toggle (lokal i dev / tills backend finns)
  const USE_LOCAL_READY = import.meta.env.DEV || !isBackendConfigured;
  const handleToggleReady = async () => {
    if (USE_LOCAL_READY) {
      // Toggla bara min egen status i local state
      setPlayers((prev) =>
        prev.map((p) => (p.id === myId ? { ...p, ready: !p.ready } : p))
      );
      return;
    }
    // Backend-läge senare:
    // const dto = await toggleReady(lobbyCode, myId, myName);
    // setPlayers(dto.players);
  };

  // === Waiting UI (vänster-litet kort: lobby+spelare, mitt-kort: knappar) ===
  if (isWaiting) {
    const maxPlayers = FIXED_MAX_PLAYERS;
    const slots = Array.from({ length: maxPlayers }, (_, i) => i);

    return (
      <div className="min-h-screen flex justify-center p-6 pt-8">
        <div className="flex items-start justify-center gap-6 w-full">
          {/* Vänster: mindre card med lobby + spelare */}
          <div className="w-80 shrink-0">
            <Card className="w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Lobby</h2>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-mono font-semibold">{lobbyCode || "—"}</span>
              </p>
              <Divider />
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">
                  Players ({players.length}/{maxPlayers})
                </div>

                {/* Lista spelare eller placeholders (Player 1–4) */}
                <div className="grid grid-cols-1 gap-2 text-left">
                  {slots.map((i) => {
                    const p = players[i];
                    // Om det finns en spelare i sloten — visa namn + chips
                    if (p) {
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium truncate">{p.playerName}</span>

                            {/* Host-chip */}
                            {p.isHost && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                Host
                              </span>
                            )}

                            {/* “Du”-chip */}
                            {p.id === myId && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                                Du
                              </span>
                            )}

                            {/* Ready/Unready: jag får klicka, andra visas som status */}
                            <div className="ml-auto">
                              {p.id === myId ? (
                                <button
                                  type="button"
                                  onClick={handleToggleReady}
                                  className={`rounded-full px-2 py-0.5 text-xs transition-colors ${p.ready
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                                    }`}
                                  aria-pressed={p.ready}
                                  title={p.ready ? "Unready" : "Ready"}
                                >
                                  {p.ready ? "Ready!" : "Ready?"}
                                </button>
                              ) : (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs ${p.ready
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                  {p.ready ? "Ready" : "Not ready"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Placeholder-slot (vänsterställt)
                    return (
                      <div
                        key={`slot-${i}`}
                        className="flex items-center justify-start rounded-lg border border-dashed bg-gray-50 px-3 py-2 text-gray-400"
                      >
                        <span className="font-medium">{`Player ${i + 1}`}</span>
                        <span className="ml-2"></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Mitten: huvudkort med actions (samma storlek som på start) */}
          <div className="self-start shrink-0">
            <Card className="w-[500px] h-[520px]">
              <div className="flex justify-center mb-4">
                <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
              </div>
              <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
                QUIZ GAME
              </h1>

              {/* Primär- och sekundärknappar */}
              <div className="mt-24 flex flex-col items-center gap-4">
                {/* Starta spel – större och centrerad */}
                <div className="w-72">
                  <Button
                    type="button"
                    onClick={handleStart}
                    disabled={!amHost}
                    title={amHost ? undefined : "Endast värden kan starta"}
                    className="w-full py-3 text-lg"
                  >
                    Starta spel
                  </Button>
                </div>

                <Divider />

                {/* Leave – mindre knapp under */}
                <div className="w-40">
                  <Button type="button" onClick={handleLeave} className="w-full">
                    Leave
                  </Button>
                </div>
              </div>

              {/* Info när backend saknas */}
              {!isBackendConfigured && (
                <>
                  <Divider />
                  <p className="mt-1 text-xs text-gray-500 text-center">
                    Backend inte konfigurerad. Sätt <code>VITE_API_BASE</code> i din{" "}
                    <code>.env</code>.
                  </p>
                </>
              )}
            </Card>
          </div>

          {/* Höger: tom spacer för att hålla mittkortet perfekt centrerat */}
          <div className="w-80 shrink-0" aria-hidden />
        </div>
      </div>
    );
  }

  // === Start/Join-läge (ingen :code i URL) ===
  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <Card className="w-[500px] h-[520px]">
        {/* Ikon */}
        <div className="flex justify-center mb-4">
          <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
          QUIZ GAME
        </h1>

        {/* Tabbar */}
        <TabList>
          <TabButton active={activeTab === "join"} onClick={() => setActiveTab("join")}>
            <span className="mr-1">#</span> Join Lobby
          </TabButton>
          <TabButton active={activeTab === "create"} onClick={() => setActiveTab("create")}>
            <span className="mr-1">+</span> Create Lobby
          </TabButton>
        </TabList>

        {/* Innehåll */}
        <div >
          {/* Namnfält */}
          <div className="mb-2">
            <TextField
              id="name"
              label="Your Name"
              placeholder="Enter your name"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {activeTab === "join" ? (
            // --- JOIN ---
            <div >
              <TextField
                id="code"
                label="Lobby Code"
                placeholder={TEST_MODE ? `ENTER ${TEST_CODE}` : "ENTER 6-DIGIT CODE"}
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />

              {/* Dev-hjälptext */}
              {TEST_MODE && normalizedCode.length > 0 && normalizedCode !== TEST_CODE && (
                <p className="text-xs text-amber-600">
                  Under utveckling funkar endast koden <code>{TEST_CODE}</code>.
                </p>
              )}

              {/* Join-knapp */}
              <Button type="button" onClick={handleJoin} disabled={!canJoin}>
                {submitting ? "Joining..." : (
                  <>
                    <span>#</span> Join Lobby
                  </>
                )}
              </Button>

              <Divider />
            </div>
          ) : (

            // --- CREATE ---
            <div >
              {!isBackendConfigured && (
                <p className="text-xs text-gray-500">
                  Backend inte konfigurerad. Sätt <code>VITE_API_BASE</code> i din <code>.env</code>.
                </p>
              )}

              {/* Extra luft mellan namnfältet och knappen */}
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={!isBackendConfigured || submitting || !name.trim()}
                >
                  {submitting ? "Creating..." : (
                    <>
                      <span>+</span> Create Lobby
                    </>
                  )}
                </Button>
              </div>

              <Divider />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
