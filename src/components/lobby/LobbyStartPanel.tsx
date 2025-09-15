/**
 * LobbyStartPanel
 *
 * Denna komponent används för att visa startskärmen när en spelare ska:
 * - gå med i en lobby (via lobbykod)
 * - skapa en ny lobby
 *
 * Funktionalitet:
 * - Växlar mellan "Join" och "Create" via tabs.
 * - Hanterar inputfält för namn (alltid) och lobbykod (endast join).
 * - Har knappar för att anropa join- eller create-funktioner.
 * - Tar in props från föräldern (LobbyPage) som bestämmer logik för anrop.
 */


import { TabList } from "../ui/TabList";
import { TabButton } from "../ui/TabButton";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Divider } from "../ui/Divider";

type Props = {
  activeTab: "join" | "create";           // aktuell tab (join eller create)
  onTabChange: (tab: "join" | "create") => void; // callback för tabbyte

  name: string;                           // spelarens namn
  onNameChange: (v: string) => void;      // uppdaterar namn

  codeInput: string;                      // lobbykod (endast för join)
  onCodeChange: (v: string) => void;      // uppdaterar lobbykod

  submitting: boolean;                    // om en request pågår
  canJoin: boolean;                       // om join-knappen ska vara aktiv

  onJoin: () => void;                     // callback när join klickas
  onCreate: () => void;                   // callback när create klickas
};

export function LobbyStartPanel({
  activeTab,
  onTabChange,
  name,
  onNameChange,
  codeInput,
  onCodeChange,
  submitting,
  canJoin,
  onJoin,
  onCreate,
}: Props) {
  return (
    <>
      {/* Tabbar för att växla mellan "Join" och "Create" */}
      <TabList>
        <TabButton active={activeTab === "join"} onClick={() => onTabChange("join")}>
          <span className="mr-1">#</span> Join Lobby
        </TabButton>
        <TabButton active={activeTab === "create"} onClick={() => onTabChange("create")}>
          <span className="mr-1">+</span> Create Lobby
        </TabButton>
      </TabList>

      <div>
        {/* Inputfält för spelarens namn (alltid synligt) */}
        <div className="mb-2">
          <TextField
            id="name"
            label="Your Name"
            placeholder="Enter your name"
            value={name}
            maxLength={24}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        {/* Join-tab: visar lobbykodsfält + join-knapp */}
        {activeTab === "join" ? (
          <>
            <TextField
              id="code"
              label="Lobby Code"
              placeholder="ENTER 6-DIGIT CODE"
              inputMode="numeric"
              maxLength={6}
              value={codeInput}
              onChange={(e) => onCodeChange(e.target.value)}
            />
            <Button type="button" onClick={onJoin} disabled={!canJoin}>
              {submitting ? "Joining..." : (<><span>#</span> Join Lobby</>)}
            </Button>
            <Divider />
          </>
        ) : (
          /* Create-tab: visar endast "Create Lobby"-knapp */
          <>
            <div className="mt-6">
              <Button
                type="button"
                onClick={onCreate}
                disabled={submitting || !name.trim()}
              >
                {submitting ? "Creating..." : (<><span>+</span> Create Lobby</>)}
              </Button>
            </div>
            <Divider />
          </>
        )}
      </div>
    </>
  );
}