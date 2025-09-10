import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { TabList } from "../components/ui/TabList";
import { TabButton } from "../components/ui/TabButton";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/icons";
import {createLobby,joinLobby,isBackendConfigured,BACKEND_NOT_ENABLED_MSG,} from "../api/lobby";

/**
 * LobbyPage – välj Join eller Create.
 */
export function LobbyPage() {
  const navigate = useNavigate();
  // Vilken tab är aktiv just nu? join/create
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  // Namn på spelaren (delas av join & create)
  const [name, setName] = useState("");
  // Används för att visa "loading"-läge medan request körs
  const [submitting, setSubmitting] = useState(false);

  // --- JOIN state ---
  // Lobbykod som spelaren skriver in
  const [code, setCode] = useState("");

  // Normaliserad version av koden (tar bort mellanslag etc.)
  const normalizedCode = useMemo(
    () => code.replace(/\s+/g, "").trim(),
    [code]
  );

  // Testkod för dev-läge
  const TEST_CODE =
    (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";
  // Är vi i utvecklingsläge och backend inte är satt?
  const TEST_MODE = import.meta.env.DEV && !isBackendConfigured;

  /**
   * När knappen för att joina ska vara aktiv:
   * - i TEST_MODE: endast om användaren skrivit exakt 123456
   * - annars: så länge fältet inte är tomt (backend får validera)
   */
  const canJoin =
    !submitting && (TEST_MODE ? normalizedCode === TEST_CODE : normalizedCode.length > 0);

  
  //Skapa lobby → anropa API och navigera till rätt sida
  const handleCreate = async () => {
    if (!isBackendConfigured || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { lobbyCode } = await createLobby({ hostName: name.trim() });
      navigate(`/lobby/${lobbyCode}`);
    } catch (err) {
      console.error(err);
      alert(BACKEND_NOT_ENABLED_MSG);  // tydlig hint tills backend är på
    } finally {
      setSubmitting(false);
    }
  };

  // Join lobby → antingen testflöde eller via backend
  const handleJoin = async () => {
    if (!canJoin) return;
    setSubmitting(true);
    try {
      // Utvecklingsläge: hoppa över backend och "joina" direkt med testkoden
      if (TEST_MODE && normalizedCode === TEST_CODE) {
        // Fejka lyckad join i utveckling
        await new Promise((r) => setTimeout(r, 120));
        navigate(`/lobby/${TEST_CODE}`);
        return;
      }

      // Prod/backend-läge: anropa API
      const { lobbyCode } = await joinLobby({
        lobbyCode: normalizedCode,
        playerName: name.trim(),
      });
      navigate(`/lobby/${lobbyCode}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : BACKEND_NOT_ENABLED_MSG;
      console.error(err);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Kortet som innehåller allt */}
      <Card>
        {/* Ikon överst */}
        <div className="flex justify-center mb-4">
          <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
          QUIZ GAME
        </h1>

        {/* Tabs för att växla mellan Join och Create */}
        <TabList>
          <TabButton
            active={activeTab === "join"}
            onClick={() => setActiveTab("join")}
          >
            <span className="mr-1">#</span> Join Lobby
          </TabButton>
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
          >
            <span className="mr-1">+</span> Create Lobby
          </TabButton>
        </TabList>

        <div>
          {/* Namnfält som delas av båda lägena */}
          <TextField
            id="name"
            label="Your Name"
            placeholder="Enter your name"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />

          {activeTab === "join" ? (
            <>
              {/* Fält för lobbykod */}
              <TextField
                id="code"
                label="Lobby Code"
                placeholder={TEST_MODE ? `ENTER ${TEST_CODE}` : "ENTER 6-DIGIT CODE"}
                inputMode="numeric"
                maxLength={6}
                value={code}                         // <-- KOPPLAD TILL STATE
                onChange={(e) => setCode(e.target.value)}
              />

              {/* Hint i dev-läge när fel kod är inskriven */}
              {TEST_MODE && normalizedCode.length > 0 && normalizedCode !== TEST_CODE && (
                <p className="text-xs text-amber-600 mb-2">
                  Under utveckling funkar endast koden <code>{TEST_CODE}</code>.
                </p>
              )}

              {/* Join-knappen, styrs av canJoin */}
              <Button
                type="button"
                onClick={handleJoin}                 
                disabled={!canJoin}                  
              >
                {submitting ? "Joining..." : (<><span>#</span> Join Lobby</>)}
              </Button>

              <Divider />
            </>
          ) : (
            <>
              {/* Visa hint när backend inte är påslagen */}
              {!isBackendConfigured && (
                <p className="text-xs text-gray-500 mb-2">
                  Backend inte konfigurerad. Sätt <code>VITE_API_BASE</code> i din <code>.env</code>.
                </p>
              )}

              {/* Create-knapp – disabled utan backend, vid submit eller tomt namn */}
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!isBackendConfigured || submitting || !name.trim()}
              >
                {submitting ? "Creating..." : (<><span>+</span> Create Lobby</>)}
              </Button>

              <Divider />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}