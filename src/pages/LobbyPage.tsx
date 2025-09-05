import { Card } from "../components/ui/Card";
import { TabList } from "../components/ui/TabList";
import { TabButton } from "../components/ui/TabButton";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { GroupIcon } from "../components/GroupIcon";

/**
 * LobbyPage - startsidan för quiz-lobbyn.
 * Just nu bara en statisk layout utan funktionalitet.
 */
export function LobbyPage() {
  return (
    // Wrapper: fyller hela höjden och centrerar kortet
    <div className="min-h-screen flex items-center justify-center p-6">
    {/* Kortet som håller allt innehåll */}
      <Card>
        {/* Ikon högst upp */}
        <div className="flex justify-center mb-4">
          <GroupIcon className="w-12 h-12 text-gray-800" />
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
          QUIZ GAME
        </h1>

        {/* Flikar för Join / Create */}
        <TabList>
          <TabButton active>
            <span className="mr-1">#</span> Join Lobby
          </TabButton>
          <TabButton>
            <span className="mr-1">+</span> Create Lobby
          </TabButton>
        </TabList>

        {/* Formulär för namn och kod */}
        <div>
          <TextField id="name" label="Your Name" placeholder="Enter your name" />
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
        </div>
      </Card>
    </div>
  );
}
