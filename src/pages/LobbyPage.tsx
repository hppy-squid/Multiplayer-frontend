import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { TabList } from "../components/ui/TabList";
import { TabButton } from "../components/ui/TabButton";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/icons";

import SockJS from "sockjs-client/dist/sockjs.js";
import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import { WS_BASE, APP, TOPIC } from "../ws/endpoints";
import {
  createLobby,
  joinLobby,
  isBackendConfigured,
  FIXED_MAX_PLAYERS,
  leaveLobby
} from "../api/lobby";
import { ensurePlayer } from "../api/ensurePlayer";
import type {
  PlayerDTO,
  LobbyLocationState,
  ServerPlayer,
  GameState,
} from "../types/types";


// Sidan för att skapa/gå med i lobby + se väntrummet
export default function LobbyPage() {
  const navigate = useNavigate();

  // Läser /lobby/:code → om code finns är vi i väntrummet ("waiting")
  const { code } = useParams<{ code: string }>();
  const location = useLocation() as { state?: LobbyLocationState };

  // === Flagga för väntrum ===
  const isWaiting = Boolean(code);
  const lobbyCode = useMemo(() => (code ?? "").toUpperCase(), [code]);

  // === UI state (join/create) ===
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  // Städar kodfältet (tar bort mellanslag)
  const normalizedCode = useMemo(
    () => codeInput.replace(/\s+/g, "").trim(),
    [codeInput]
  );

  // Dev-test utan backend (kan tas bort när backend alltid är på)
  const TEST_CODE = (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";
  const TEST_MODE = import.meta.env.DEV && !isBackendConfigured;

  // När får man trycka "Join"?
  const canJoin =
    !submitting &&
    (TEST_MODE ? normalizedCode === TEST_CODE : normalizedCode.length > 0);

  // === Identitet (id/namn) ===
  const navId = location.state?.playerId as number | undefined; // från ensurePlayer() via navigate state

  const storedIdStr =
    sessionStorage.getItem("playerId") ?? localStorage.getItem("playerId");
  const storedId =
    storedIdStr && /^\d+$/.test(storedIdStr) ? Number(storedIdStr) : undefined;

  // Endast numeriskt playerId som backend känner till
  const myIdNum: number | undefined = typeof navId === "number" ? navId : storedId;
  const myIdStr = myIdNum !== undefined ? String(myIdNum) : "";

  // Namn
  const rawName =
    location.state?.playerName ??
    sessionStorage.getItem("playerName") ??
    localStorage.getItem("playerName") ??
    "";
  const myName = String(rawName ?? "").trim() || "Player";
  

  // Spara playerId/playerName i sessionStorage när vi säkert har dem
  useEffect(() => {
    if (typeof navId === "number") {
      sessionStorage.setItem("playerId", String(navId));
    }
    if (myName) {
      sessionStorage.setItem("playerName", myName);
    }
  }, [navId, myName]);

  // === Spelarlistan som visas i UI ===
  const [players, setPlayers] = useState<PlayerDTO[]>([]);

  // Är jag host? (först från navigation state, annars från players-listan)
  const amHost = useMemo(() => {
    if (location.state?.isHost != null) return Boolean(location.state.isHost);
    const me = players.find(p => String(p.id) === myIdStr);
    return !!me?.isHost;
  }, [location.state?.isHost, players, myIdStr]);

  // Hjälp: mappa server-spelare -> UI-spelare
  const toUI = (arr: ServerPlayer[]): PlayerDTO[] =>
    arr.map((p) => ({
      id: String(p.id),
      playerName: p.playerName,
      score: p.score,
      isHost: p.isHost,
      ready: !!p.ready,
    }));

  // Initial hydra: ta spelare direkt från navigate(..., { state.initialPlayers })
  // Detta gör att listan syns direkt även om första WS-meddelandet dröjer
  useEffect(() => {
    if (!isWaiting) return;

    const initial: ServerPlayer[] | undefined = location.state?.initialPlayers;
    if (initial?.length) {
      setPlayers(toUI(initial));
      return;
    }

  }, [isWaiting, lobbyCode, isBackendConfigured, location.state]);

  // === WebSocket/STOMP — lyssna på lobbyuppdateringar ===
  const stompRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!isWaiting || !isBackendConfigured) return;

    // Skapa STOMP-klient som ansluter via SockJS till din backend (/ws)
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      reconnectDelay: 1000,
      debug: (msg) => {
        if (import.meta.env.DEV) console.log("[STOMP]", msg);
      },
    });

    client.onConnect = () => {
      // Prenumerera på lobby-topic → får nya spelarlisor vid join/leave/ready m.m.
      client.subscribe(TOPIC.LOBBY(lobbyCode), (frame: IMessage) => {
        const dto = JSON.parse(frame.body) as { players: ServerPlayer[]; gameState?: GameState };
        setPlayers(toUI(dto.players));
      });

      // (exempel) fler topics:
      // client.subscribe(TOPIC.RESPONSE(lobbyCode), ...);
      // client.subscribe(TOPIC.READY(lobbyCode), ...);
    };

    client.onStompError = (f) => {
      console.error("Broker error:", f.headers["message"], f.body);
    };

    client.activate();
    stompRef.current = client;

    // Stäng anslutning när komponenten unmountas eller lobbyCode ändras
    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [isWaiting, isBackendConfigured, lobbyCode]);


  // === Actions ===

  // Skapa lobby → backend returnerar hela lobbyn → navigera till väntrummet med initialPlayers
  const handleCreate = async () => {
    if (!isBackendConfigured || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      // Säkerställ att det finns en spelare i backend
      const { playerId, playerName } = await ensurePlayer(name);

      // Skapa lobby → får tillbaka spelarlisan (inkl. host)
      const dto = await createLobby({ playerId });

      // Navigera till väntrummet och skicka med initialPlayers (hydra direkt)
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
      console.error(err);
      alert(err instanceof Error ? err.message : "Okänt fel vid skapande av lobby");
    } finally {
      setSubmitting(false);
    }
  };


  // Gå med i befintlig lobby
  const handleJoin = async () => {
    if (!canJoin) return;
    setSubmitting(true);
    try {
      const { playerId, playerName } = await ensurePlayer(name);

      // Dev-genväg: endast testkod när backend inte körs
      if (TEST_MODE && normalizedCode === TEST_CODE) {
        navigate(`/lobby/${TEST_CODE}`, {
          state: { isHost: false, playerId, playerName },
        });
        return;
      }

      // Riktig join → backend returnerar hela lobbyn (inkl. nuvarande spelare)
      const dto = await joinLobby({ lobbyCode: normalizedCode, playerId });

      // Navigera och skicka med initialPlayers för direkt visning
      navigate(`/lobby/${dto.lobbyCode}`, {
        state: {
          isHost: false,
          playerId,
          playerName,
          initialPlayers: dto.players, // hydra direkt för att undvika WS-race
          gameState: dto.gameState,
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunde inte gå med i lobbyn");
    } finally {
      setSubmitting(false);
    }
  };

  // Gå tillbaka till startsidan
  const handleLeave = async () => {
    // Om vi inte är i väntrummet eller backend saknas – bara gå hem
    if (!isWaiting || !isBackendConfigured) {
      // stäng ev. WS snyggt
      if (stompRef.current) {
        try { await stompRef.current.deactivate(); } catch {// ignore 
        }
        stompRef.current = null;
      }
      navigate("/", { replace: true });
      return;
    }
    if (myIdNum === undefined) {            // guard
      alert("Saknar giltigt playerId – skapa/gå med i en lobby först.");
      return;
    }

    try {
      // 1) Anropa backend (triggar broadcast till alla i lobbyn)
      const dto = await leaveLobby({ lobbyCode, playerId: myIdNum });

      // 2) Om lobbyn blev tom (servern kan returnera id=null) → gå hem
      if (dto.id == null || dto.players.length === 0) {
        if (stompRef.current) {
          try { await stompRef.current.deactivate(); } catch {// ignore
          }
          stompRef.current = null;
        }
        navigate("/", { replace: true });
        return;
      }

      // 3) Om lobbyn fortfarande finns: vi lämnar ändå sidan (du lämnar ju lobbyn)
      if (stompRef.current) {
        try { await stompRef.current.deactivate(); } catch {//ignore 
        }
        stompRef.current = null;
      }
      navigate("/", { replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kunde inte lämna lobbyn");
    }
  };

  // Starta spelet (just nu bara navigering — lägg WS publish här om backend stödjer)
  const handleStart = () => {
    if (!amHost) return;
    navigate(`/game/${lobbyCode}`, { state: { fromWaitingRoom: true } });
  };

  // Toggle "ready" —  publicera via WS
  const handleToggleReady = () => {
    if (myIdNum === undefined) {
      alert("Saknar giltigt playerId – skapa/gå med i en lobby först.");
      return;
    }
    stompRef.current?.publish({
      destination: APP.READY(lobbyCode),
      body: JSON.stringify({ playerId: myIdNum, playerName: myName, ready: !isReady }),
      headers: { "content-type": "application/json" },
    });
    setIsReady(p => !p);
  };

  const PLAYER_COLORS = [
    { bg: "#FDF6B2", text: "#92400E" }, // pastellgul/vanilj
    { bg: "#FFE5B4", text: "#92400E" }, // ljusare aprikos/persika
    { bg: "#DBEAFE", text: "#1E3A8A" }, // babyblå
    { bg: "#FDE2E4", text: "#9D174D" }, // babyrosa
  ];

  const [isReady, setIsReady] = useState(false);



  // === Väntrumsvy ===
  if (isWaiting) {
    const maxPlayers = FIXED_MAX_PLAYERS;
    const slots = Array.from({ length: maxPlayers }, (_, i) => i);

    return (
      <div className="min-h-screen flex justify-center p-6 pt-8">
        <div className="flex items-start justify-center gap-6 w-full">

          {/* Vänster: Lobby + players */}
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

                <div className="grid grid-cols-1 gap-2 text-left">
                  {slots.map((i) => {
                    const p = players[i];
                    const color = PLAYER_COLORS[i];
                    if (p) {
                      return (
                        <div
                          key={`${p.id}-${i}`}
                          className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium truncate">{p.playerName}</span>

                            {/* Visar "Host"-chip */}
                            {p.isHost && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.6)",
                                  color: color.text,
                                  border: `1px solid ${color.text}`
                                }}
                              >
                                Host
                              </span>
                            )}

                            {/* Visar "Du"-chip för mig själv */}
                            {String(p.id) === myIdStr && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.6)",
                                  color: color.text,
                                  border: `1px solid ${color.text}`
                                }}
                              >
                                You
                              </span>
                            )}

                            <div className="ml-auto">
                              {String(p.id) === myIdStr ? (
                                <button
                                  type="button"
                                  onClick={handleToggleReady}
                                  aria-pressed={p.ready}
                                  className="rounded-full px-2 py-0.5 text-xs transition-colors"
                                  style={
                                    p.ready
                                      ? {
                                        backgroundColor: "hsl(140, 60%, 90%)",
                                        color: "hsl(140, 30%, 25%)",
                                        border: "1px solid hsl(140, 40%, 65%)"
                                      }
                                      : {
                                        backgroundColor: "hsl(0, 0%, 95%)",
                                        color: "hsl(0, 0%, 30%)",
                                        border: "1px solid hsl(0, 0%, 75%)"
                                      }
                                  }
                                >
                                  {p.ready ? "Ready!" : "Ready?"}
                                </button>
                              ) : (
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs"
                                  style={
                                    p.ready
                                      ? {
                                        backgroundColor: "hsl(140, 60%, 90%)",
                                        color: "hsl(140, 30%, 25%)",
                                        border: "1px solid hsl(140, 40%, 65%)"
                                      }
                                      : {
                                        backgroundColor: "hsl(0, 0%, 95%)",
                                        color: "hsl(0, 0%, 30%)",
                                        border: "1px solid hsl(0, 0%, 75%)"
                                      }
                                  }
                                >
                                  {p.ready ? "Ready" : "Not ready"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Tomma platser (placeholder-kort)
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


          {/* Mitten: huvud-actions */}
          <div className="self-start shrink-0">
            <Card className="w-[500px] h-[520px]">
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
                    disabled={!amHost}
                    title={amHost ? undefined : "Endast värden kan starta"}
                    className="w-full py-3 text-lg"
                  >
                    Start Game
                  </Button>
                </div>

                <Divider />

                <div className="w-40">
                  <Button type="button" onClick={handleLeave} className="w-full">
                    Leave
                  </Button>
                </div>
              </div>

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

          {/* Högerspacer för centrerad layout */}
          <div className="w-80 shrink-0" aria-hidden />
        </div>
      </div>
    );
  }



  // === Start/Join-vy (innan man är i väntrummet) ===
  return (
    <div className="min-h-screen flex justify-center p-6 pt-8">
      <Card className="w-[500px] h-[520px]">
        <div className="flex justify-center mb-4">
          <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
        </div>

        <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
          QUIZ GAME
        </h1>

        <TabList>
          <TabButton active={activeTab === "join"} onClick={() => setActiveTab("join")}>
            <span className="mr-1">#</span> Join Lobby
          </TabButton>
          <TabButton active={activeTab === "create"} onClick={() => setActiveTab("create")}>
            <span className="mr-1">+</span> Create Lobby
          </TabButton>
        </TabList>

        <div>
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
            <div>
              <TextField
                id="code"
                label="Lobby Code"
                placeholder={TEST_MODE ? `ENTER ${TEST_CODE}` : "ENTER 6-DIGIT CODE"}
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />

              {TEST_MODE && normalizedCode.length > 0 && normalizedCode !== TEST_CODE && (
                <p className="text-xs text-amber-600">
                  Under utveckling funkar endast koden <code>{TEST_CODE}</code>.
                </p>
              )}

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
            <div>
              {!isBackendConfigured && (
                <p className="text-xs text-gray-500">
                  Backend inte konfigurerad. Sätt <code>VITE_API_BASE</code> i din <code>.env</code>.
                </p>
              )}

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
