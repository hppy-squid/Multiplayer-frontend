/**
 * Filens syfte:
 *
 * `LobbySidebar` visar information om en lobby och dess spelare.
 * Den kan:
 * - Visa lobbykod
 * - Lista alla spelare i lobbyn med plats för tomma slots
 * - Markera vem som är Host och vem som är "You" (jag själv)
 * - Visa och hantera "Ready"-status (knapp för mig, status för andra)
 *
 * Props:
 * - lobbyCode: sträng med lobbykod att visa
 * - players: lista med spelare (PlayerDTO) från servern
 * - myIdStr: mitt id som sträng för att känna igen "jag"
 * - maxPlayers: max antal spelare (default 4)
 * - onToggleReady: callback när jag klickar på "Ready"-knappen
 */

import { Card } from "../ui/Card";
import { Divider } from "../ui/Divider";
import type { PlayerDTO } from "../../types/types";

// Färgtema per spelarslot (1–4)
// Ger olika bakgrundsfärg och textfärg för varje plats
const PLAYER_COLORS = [
  { bg: "#FDF6B2", text: "#92400E" },
  { bg: "#FFE5B4", text: "#92400E" },
  { bg: "#DBEAFE", text: "#1E3A8A" },
  { bg: "#FDE2E4", text: "#9D174D" },
];

// Inparametrar till sidebaren
type Props = {
  lobbyCode: string;            // lobbykod att visa  
  players: PlayerDTO[];         // lista med spelare (från servern)
  myIdStr: string;              // mitt id som sträng (för att känna igen "jag")
  maxPlayers?: number;          // max antal platser (default 4)
  onToggleReady: () => void;    // klick på Ready för mig 
  statusMode?: "ready" | "answered";
};

export function LobbySidebar({
  lobbyCode,
  players,
  myIdStr,
  maxPlayers = 4,
  onToggleReady,
  statusMode = "ready",
}: Props) {
  // Skapa en array [0..maxPlayers-1] som används för att loopa ut slots
  const slots = Array.from({ length: maxPlayers }, (_, i) => i);

  return (
    <Card className="w-full">
      {/* Rubrik och lobbykod */}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Lobby</h2>
      <p className="text-sm text-gray-600 mb-4">
        <span className="font-mono font-semibold">{lobbyCode || "—"}</span>
      </p>
      <Divider />

      <div className="mt-4">
        {/* Räknare: hur många spelare av max */}
        <div className="text-sm text-gray-500 mb-2">
          Players ({players.length}/{maxPlayers})
        </div>

        {/* En rad per slot (spelare eller tom plats) */}
        <div className="grid grid-cols-1 gap-2 text-left">
          {slots.map((i) => {
            const p = players[i];
            const color = PLAYER_COLORS[i];

            if (!p) {
              return (
                <div
                  key={`slot-${i}`}
                  className="flex items-center justify-start rounded-lg border border-dashed bg-gray-50 px-3 py-2 text-gray-400"
                >
                  <span className="font-medium">{`Player ${i + 1}`}</span>
                </div>
              );
            }

            const isMe = String(p.id) === myIdStr;
            const isReadyMode = statusMode === "ready";

            // Quiz-läge (answered)
            const hasAnswered = !!p.answered;
            const isCorrect = p.correct === true;
            // const isWrong = p.correct === false;

            // Etiketter
            const meLabel = isReadyMode
              ? p.ready
                ? "Ready!"
                : "Ready?"
              : hasAnswered
                ? isCorrect
                  ? "Correct!"
                  : "Wrong!"
                : "Answer…";

            const otherLabel = isReadyMode
              ? p.ready
                ? "Ready"
                : "Not ready"
              : hasAnswered
                ? isCorrect
                  ? "Correct"
                  : "Wrong"
                : "Thinking…";

            // Stilar
            const styleNeutral = {
              backgroundColor: "hsl(0, 0%, 95%)",
              color: "hsl(0, 0%, 30%)",
              border: "1px solid hsl(0, 0%, 75%)",
            };
            const styleCorrect = {
              backgroundColor: "hsl(140, 60%, 90%)",
              color: "hsl(140, 30%, 25%)",
              border: "1px solid hsl(140, 40%, 65%)",
            };
            const styleWrong = {
              backgroundColor: "hsl(0, 70%, 90%)",
              color: "hsl(0, 50%, 25%)",
              border: "1px solid hsl(0, 60%, 70%)",
            };

            const badgeStyle = isReadyMode
              ? p.ready ? styleCorrect : styleNeutral
              : !hasAnswered
                ? styleNeutral
                : isCorrect
                  ? styleCorrect
                  : styleWrong;

            return (
              <div
                key={`${p.id}-${i}`}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                <div className="flex items-center gap-2 w-full">
                    {/* Spelarens namn */}
                  <span className="font-medium truncate">{p.playerName}</span>

{                  <span className="font-medium truncate">{p.score} pts</span>
}
                     {/* Host-badge om spelaren är värd */}
                  {p.isHost && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.6)",
                        color: color.text,
                        border: `1px solid ${color.text}`,
                      }}
                    >
                      Host
                    </span>
                  )}

                    {/* You-badge om spelaren är jag */}
                  {isMe && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.6)",
                        color: color.text,
                        border: `1px solid ${color.text}`,
                      }}
                    >
                      You
                    </span>
                  )}

                    {/* Ready UI: jag får knapp, andra ser status */}
                  <div className="ml-auto">
                    {isReadyMode && isMe ? (
                      <button
                        type="button"
                        onClick={onToggleReady}
                        aria-pressed={p.ready}
                        className="rounded-full px-2 py-0.5 text-xs transition-colors"
                        style={badgeStyle}
                      >
                        {meLabel}
                      </button>
                    ) : (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={badgeStyle}
                      >
                        {isMe ? meLabel : otherLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}