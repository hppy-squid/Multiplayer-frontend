/**
 * Filens syfte:
 *
 * Den här filen definierar komponenten `LobbyActions`, som visar UI för att:
 * - Starta spelet (Start Game)
 * - Lämna lobbyn (Leave)
 *
 * Komponentens props:
 * - onStart: callback som körs när användaren trycker på "Start Game"
 * - onLeave: callback som körs när användaren trycker på "Leave"
 * - disabledStart: boolean som styr om "Start Game"-knappen är aktiv
 */

import { Card } from "../ui/Card";            // UI-komponent för kortlayout
import { Button } from "../ui/Button";        // UI-komponent för knappar
import { Divider } from "../ui/Divider";      // UI-komponent för visuell avdelare
import GroupIcon from "@mui/icons-material/Group"; // Ikon från Material UI

// Props-typ: bestämmer vilka värden komponenten förväntar sig
type Props = { 
  onStart: () => void;       // Callback när spelet startas
  onLeave: () => void;       // Callback när man lämnar lobbyn
  disabledStart: boolean;    // Stänger av start-knappen om true
};

// Komponent: visar actions som kan göras i lobbyn
export function LobbyActions({ onStart, onLeave, disabledStart }: Props) {
  return (
    <Card className="w-[800px] h-[520px]">
      {/* Ikon högst upp */}
      <div className="flex justify-center mb-4">
        <GroupIcon sx={{ fontSize: 56 }} className="text-gray-800" />
      </div>

      {/* Titel */}
      <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">QUIZ GAME</h1>

      {/* Actions (Start + Leave) centrerade vertikalt */}
      <div className="mt-24 flex flex-col items-center gap-4">
        {/* Start-knapp */}
        <div className="w-72">
          <Button onClick={onStart} disabled={disabledStart} className="w-full py-3 text-lg">Start Game</Button>
        </div>

        {/* Avdelare mellan knapparna */}
        <Divider />

        {/* Leave-knapp */}
        <div className="w-40">
          <Button onClick={onLeave} className="w-full">Leave</Button>
        </div>
      </div>
    </Card>
  );
}