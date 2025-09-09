import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { TabList } from "../components/ui/TabList";
import { TabButton } from "../components/ui/TabButton";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/icons";
import { createLobby, isBackendConfigured, BACKEND_NOT_ENABLED_MSG } from "../api/lobby";

/**
 * LobbyPage – välj Join eller Create.
 * Create: anropar createLobby() och navigerar till /lobby/:code.
 * Knappen är avstängd tills backend är konfigurerad (VITE_API_BASE).
 */
export function LobbyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Skapa lobby → navigera på success
  const handleCreate = async () => {
    if (!isBackendConfigured || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { lobbyCode } = await createLobby({ hostName: name.trim() });
      navigate(`/lobby/${lobbyCode}`);
    } catch (err) {
      console.error(err);
      // tydlig hint tills backend är på
      alert( BACKEND_NOT_ENABLED_MSG );
  
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Wrapper: fyller hela höjden och centrerar kortet
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Kortet som håller allt innehåll */}
      <Card>
        {/* Ikon högst upp */}
        <div className="flex justify-center mb-4">
          <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
          QUIZ GAME
        </h1>

        {/* Växla mellan Join och Create */}
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

        {/* Gemensamt namn-fält */}
        <div>
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
              {/* TODO: koppla på join-flödet när backend finns */}
              <TextField
                id="code"
                label="Lobby Code"
                placeholder="ENTER 6-DIGIT CODE"
                inputMode="numeric"
                maxLength={6}
              />

              {/* Join-knapp (inaktiv just nu) */}
              <Button type="button" disabled>
                <span>#</span> Join Lobby
              </Button>

              {/* Dekorativ linje under knappen */}
              <Divider />
            </>
          ) : (
            <>
              {/* Visa hint när backend inte är konfigurerad */}
              {!isBackendConfigured && (
                <p className="text-xs text-gray-500 mb-2">
                  Backend inte konfigurerat. Sätt <code>VITE_API_BASE</code> i
                  din <code>.env</code>.
                </p>
              )}

              {/* Skapa lobby – disabled utan backend, vid submit eller tomt namn */}
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