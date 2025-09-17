/******************************************************
 * UI-komponent: QuizTime
 * Räknar ner tid för frågefas/svarsfasklocka i quizet
 ******************************************************/


import { useEffect, useMemo, useState } from "react";

export type Phase = "question" | "answer";

type Props = {
  phase: Phase;   // serverns fas
  endsAt: number; // epoch millis då fasen tar slut (från servern)
};

export function QuizTime({ phase, endsAt }: Props) {
  // Håll lokal "nu"-klocka som tickar
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Ticker som uppdaterar "nu" 4 ggr/sek för smidig nedräkning
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Beräkna sekunder kvar, avrunda uppåt (3.2s -> 4s)
  const timeLeft = useMemo(() => {
    const ms = Math.max(0, endsAt - now);
    return Math.ceil(ms / 1000);
  }, [endsAt, now]);

  const isRed = phase === "question" && timeLeft <= 3;
  const label = phase === "question" ? "Answer now…" : "Showing answer";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div
        className={`text-3xl font-bold transition-colors duration-300 ${
          isRed ? "text-red-500" : "text-gray-800"
        }`}
      >
        {timeLeft}s
      </div>
    </div>
  );
}
