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
import { getQuestionAndOptions } from "../../api/QuestionsApi";
import { useEffect, useState } from "react";
import type {QuizTimerState} from "./QuizTime.tsx";


/** Hjälpfunktion för att slumpa en array */
function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

/** ViewModel för en fråga */
type QuestionVM = { text: string; options: string[] };

export function Questions() {
  // State: kö av fråge-ID:n
  const [ids, setIds] = useState<number[]>([]);
  // State: nuvarande fråge-ID
  const [currentId, setCurrentId] = useState<number | null>(null);
  // State: nuvarande fråga
  const [question, setQuestion] = useState<QuestionVM | null>(null);
  // UI-state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const checkTimer = () => {
      const timer: QuizTimerState | undefined = window.quizTimer;
      if (timer) {
        // Efter att resultatet för frågan har visats, gå till nästa fråga
        if (timer.phase === 'question' && timer.timeLeft === 15) {
          nextQuestion();
        }
      }
    };

    // Kolla varje sekund
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Slumpa fram vilken fråga som visas

  useEffect(() => {
    const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
    setIds(shuffle(numbers));
  }, []);

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
          options: shuffle(data.map((d) => d.option_text).filter(Boolean)),
        });
      } catch (e: unknown) {
        if (!alive) return;   // undvik setState efter unmount
        setError(e instanceof Error ? e.message ?? "Kunde inte hämta fråga." : "Kunde inte hämta fråga.");
        setQuestion(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentId]);

   
    /** Visa nästa fråga i kön */
    const nextQuestion = () => {
      setIds(prev => {
        const [, next, ...rest] = prev;
        setCurrentId(next ?? null);
        return [next!, ...rest].filter(v => v != null) as number[];
      });
    };

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
            {question.options.map((opt: string, index: number) => (
              <li key={index}>{opt}</li>
            ))}
          </ul>

           {/* Divider */}
          <Divider className="my-6" />

          {/* Knapp för nästa fråga */}
          <Button onClick={nextQuestion}  className="w-full">
            Nästa Fråga
          </Button>
        </>
      )}
    </Card>
  );
}