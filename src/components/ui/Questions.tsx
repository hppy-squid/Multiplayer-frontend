import { Card } from "./Card";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { getQuestionAndOptions } from "../../api/QuestionsApi";
import { useEffect, useState } from "react";
import type {QuizTimerState} from "./QuizTime.tsx";


/**
 * Ändringar:
 * - Typat question (ingen 'any')
 * - Loading/error-states för bättre UX
 * - Guard mot tomt/konstigt API-svar
 * - Avbryt setState när effekten inte längre är "alive"
 * - Options-mappning med filter(Boolean)
 * - Tydliga tomt/laddning/fel-vyer
 */


function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

// ViewModel för fråga → tydlig typ
type QuestionVM = { text: string; options: string[] };

export function Questions() {
  // Kö med id:n att hämta
  const [ids, setIds] = useState<number[]>([]);
  // Vilket id visas nu
  const [currentId, setCurrentId] = useState<number | null>(null);
  // Den renderade frågan
  const [question, setQuestion] = useState<QuestionVM | null>(null);
  // UI-tillstånd
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

 // Sätt första id
  useEffect(() => {
    setCurrentId(ids.length > 0 ? ids[0] : null);
  }, [ids]);

// Hämta fråga från backend
  useEffect(() => {
    if (currentId == null) {
      setQuestion(null);
      return;
    }
    let alive = true;   // stoppa setState om effekten blir “inaktuell”

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getQuestionAndOptions(currentId);

        // Skydda mot tomt/konstigt svar
        if (!alive) return;

        // Hitta frågan och svarsalternativen
        if (!Array.isArray(data) || data.length === 0) {
          setQuestion(null);
          setError("Ingen fråga hittades.");
          return;
        }

        // Säkerställ att det finns fråga och svarsalternativ
        setQuestion({
          text: data[0].question ?? "Okänd fråga",
          options: shuffle(data.map((d) => d.option_text).filter(Boolean)),
        });
      } catch (e: unknown) {
        if (!alive) return;   // undvik setState efter unmount

        // Felhantering
        setError(e instanceof Error ? e.message ?? "Kunde inte hämta fråga." : "Kunde inte hämta fråga.");
        setQuestion(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // Rensa upp: markera effekten som inaktuell
    return () => {
      alive = false;
    };
  }, [currentId]);

   
    // Visa nästa fråga i kön (eller tom
    const nextQuestion = () => {
    setIds(prev => prev.slice(1)); 
    setCurrentId(ids[1] ?? null);  
  };

  return (
    <Card>
      {/* Laddningsindikator */}
      {loading && <div>Laddar fråga…</div>}

      {/* Felmeddelande */}
      {error && <div className="text-red-600">Fel: {error}</div>}

      {/* Tomvy (ingen fråga ännu) */}
      {!loading && !question && !error && (
        <div>Väntar på fråga…</div>
      )}

      {/* Huvudinnehåll */}
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

            {/* Nästa fråga-knapp */}
          <Button onClick={nextQuestion}  className="w-full">
            Nästa Fråga
          </Button>
        </>
      )}
    </Card>
  );
}