/**
 * Filens syfte:
 *
 * Denna fil innehåller `Questions`-komponenten som visar quizfrågor från backend.
 * - Hämtar en fråga + svarsalternativ via API:t `getQuestionAndOptions`.
 * - Visar laddnings-, fel- och tomvy-tillstånd.
 * - Använder en slumpad kö av fråge-ID:n för att visa frågor i slumpmässig ordning.
 * - Ger användaren möjlighet att gå vidare till nästa fråga.
 */

import { Card } from "./Card";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { getCorrectAnswer, getQuestionAndOptions } from "../../api/QuestionsApi";
import { useEffect, useState, useRef, useCallback } from "react";
import type {QuizTimerState} from "./QuizTime.tsx";



/** Hjälpfunktion för att slumpa en array */

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

/** Typa window så vi slipper `any` */
type WindowWithQuizTimer = Window & { quizTimer?: QuizTimerState };

/** ViewModel för en fråga */
type QuestionVM = { text: string; options: string[] };

export type QuestionsProps = {
  /** Antal frågor i rundan (default 5) */
  total?: number;
  /** Callback när progress ändras: (antal passerade, total) */
  onProgressChange?: (answered: number, total: number) => void;
  /** Callback när rundan är klar */
  onComplete?: () => void;
};

export function Questions({ total = 5, onProgressChange, onComplete }: QuestionsProps) {
  // --- State ---
  const [ids, setIds] = useState<number[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [question, setQuestion] = useState<QuestionVM | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);

  // Val-/visningsstate
  const [guessed, setGuessed] = useState(false);
  const [guessedOption, setGuessedOption] = useState<string | null>(null);

  // Lås som garanterar att vi bara avancerar EN gång per fråga (timer/knapp)
  const advanceLockRef = useRef(false);

  // --- Initiera kö och nollställ progress när `total` ändras ---
  useEffect(() => {
    const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
    const queue = shuffle(numbers).slice(0, Math.max(0, total));
    setIds(queue);
    setAnswered(0);
  }, [total]);

  // --- Rapportera progress separat (så vi inte nollställer oavsiktligt) ---
  useEffect(() => {
    onProgressChange?.(answered, total);
  }, [answered, total, onProgressChange]);

  // Sätt första fråge-ID när kön är laddad
  useEffect(() => {
    setCurrentId(ids.length > 0 ? ids[0] : null);
  }, [ids]);

  // Hämta fråga och svarsalternativ från backend
  useEffect(() => {
    if (currentId == null) {
      setQuestion(null);
      return;
    }
    let alive = true;   // skyddar mot setState efter unmount

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getQuestionAndOptions(currentId);

        if (!alive) return;

        // Kontrollera om API-svaret innehåller en giltig fråga
        if (!Array.isArray(data) || data.length === 0) {
          setQuestion(null);
          setError("Ingen fråga hittades.");
          return;
        }

        // Sätt frågetext och alternativ
        setQuestion({
          text: data[0].question ?? "Okänd fråga",
          options: shuffle(data.map(d => d.option_text).filter(Boolean)),
        });

        const correct = await getCorrectAnswer(currentId);
        if (!alive) return;
        setCorrectAnswer(correct.option_text);

        // Ny fråga: lås upp avanceringslåset och nollställ val
        advanceLockRef.current = false;
        setGuessed(false);
        setGuessedOption(null);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? (e.message ?? "Kunde inte hämta fråga.") : "Kunde inte hämta fråga.");
        setQuestion(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentId]);

  // --- Nästa fråga: låst + clamp:a progress ---
  const nextQuestion = useCallback(() => {
    if (advanceLockRef.current) return;        // hindra dubbeltrigger
    advanceLockRef.current = true;

    setAnswered(a => Math.min(total, a + 1));  // clamp mot total

    setIds(prev => {
      const [, next, ...rest] = prev;

      if (next == null) {
        setCurrentId(null);
        onComplete?.();
        return [];
      }

      setCurrentId(next);
      return [next, ...rest];
    });
  }, [onComplete, total]);

  // --- Auto-advance när frågetiden (eller svarstiden) tar slut ---
  // OBS: matchar typningen "question" | "answer"
  useEffect(() => {
    const interval = setInterval(() => {
      const timer = (window as WindowWithQuizTimer).quizTimer;
      if (!timer || advanceLockRef.current) return;

      const isQuestionFinished = timer.phase === "question" && timer.timeLeft === 0;
      const isAnswerFinished   = timer.phase === "answer"   && timer.timeLeft === 0;

      if (isQuestionFinished || isAnswerFinished) {
        nextQuestion(); // låsningen hanteras i nextQuestion
      }
    }, 250);

    return () => clearInterval(interval);
  }, [currentId, nextQuestion]);

  // --- Val av svar ---
  const handleGuess = useCallback((option: string) => {
    setGuessed(true);
    setGuessedOption(option);
    // multiplayer: här kan man trigga WS “jag är klar”
  }, []);

  // --- Render ---
  return (
    <Card>
      {/* Laddningsvy */}
      {loading && <div>Laddar fråga…</div>}

      {/* Felvy */}
      {error && <div className="text-red-600">Fel: {error}</div>}

      {/* Tomvy (ingen fråga ännu) */}
      {!loading && !question && !error && (
        <div>Väntar på fråga…</div>
      )}

      {/* Frågevy */}
      {question && (
        <>
          {/* Frågetext */}
          <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
            {question.text}
          </h1>

           {/*svarsalternativ */}
          <ul className="space-y-4">
            {question.options.map((opt, index) => {
              let className = "w-full";

              if (guessed) {
                if (opt === correctAnswer) {
                  className += " bg-green-500 text-white"; // rätt svar
                } else if (opt === guessedOption && opt !== correctAnswer) {
                  className += " bg-red-500 text-white"; // fel gissning
                } else {
                  className += " bg-gray-200"; // övriga
                }
              }

              return (
                <li key={index}>
                  <Button
                    onClick={() => handleGuess(opt)}
                    disabled={guessed}
                    className={className}
                  >
                    {opt}
                  </Button>
                </li>
              );
            })}
          </ul>

          <Divider className="my-6" />

          {/* Knapp för nästa fråga */}
          <Button
            onClick={nextQuestion}
            disabled={advanceLockRef.current || loading}
            className="w-full"
          >
            Nästa Fråga
          </Button>
        </>
      )}
    </Card>
  );
}