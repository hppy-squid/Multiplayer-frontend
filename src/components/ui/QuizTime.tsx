// components/ui/QuizTime.tsx (ERSÄTT filen med detta)
import { useEffect, useMemo, useState } from "react";

export type Phase = "question" | "answer";

export type QuizTimerState = {
  timeLeft: number;         // sekunder kvar (avrundat uppåt)
  phase: Phase;             // "question" | "answer"
  isRed: boolean;           // visuellt cue
};

declare global {
  interface Window {
    quizTimer?: QuizTimerState;
  }
}

type Props = {
  phase: Phase;             // serverns fas
  endsAt: number;           // epoch millis då fasen tar slut
};

export function QuizTime({ phase, endsAt }: Props) {
  // räkna ner utifrån serverns endsAt
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const timeLeft = useMemo(() => {
    const ms = Math.max(0, endsAt - now);
    return Math.ceil(ms / 1000); // 3.2s → 4s
  }, [endsAt, now]);

  const isRed = phase === "question" && timeLeft <= 3;

  // Exponera till window för andra komponenter (om ni använder det)
  useEffect(() => {
    window.quizTimer = { timeLeft, phase, isRed };
  }, [timeLeft, phase, isRed]);

  const label = phase === "question" ? "Svarar..." : "Visar svar";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className={`text-3xl font-bold transition-colors duration-300 ${isRed ? "text-red-500" : "text-gray-800"}`}>
        {timeLeft}s
      </div>
    </div>
  );
}
