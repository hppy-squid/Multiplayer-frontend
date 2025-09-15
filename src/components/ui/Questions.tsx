/**
 * Questions – server-styrt om `round` finns, annars klient-styrt fallback.
 * Wrappern anropar INGA hooks → undviker "hooks called conditionally".
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { getCorrectAnswer, getQuestionAndOptions } from "../../api/QuestionsApi";
import type { QuizTimerState } from "./QuizTime";

// ===== Gemensamt =====
type QuestionVM = { text: string; options: string[] };
function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }
type WindowWithQuizTimer = Window & { quizTimer?: QuizTimerState };

export type RoundDTO = {
  questionId: number;
  index: number;
  total: number;
  phase: "question" | "answer";
  endsAt: number;            // epoch ms (valfritt att använda)
  answeredCount?: number;
};

export type QuestionsProps =
  | ({ round: RoundDTO; onAnswer?: (option: string) => void } & { total?: never; onProgressChange?: never; onComplete?: never })
  | ({ round?: undefined; total?: number; onProgressChange?: (answered: number, total: number) => void; onComplete?: () => void } & { onAnswer?: never });

export function Questions(props: QuestionsProps) {
  // OBS: inga hooks här!
  if ("round" in props && props.round) {
    return <QuestionsControlled round={props.round} onAnswer={props.onAnswer} />;
  }
  return (
    <QuestionsLocal
      total={props.total ?? 5}
      onProgressChange={props.onProgressChange}
      onComplete={props.onComplete}
    />
  );
}

/* =========================
   SERVER-STYRT (Controlled)
   ========================= */
function QuestionsControlled({
  round,
  onAnswer,
}: {
  round: RoundDTO;
  onAnswer?: (opt: string) => void;
}) {
  const [question, setQuestion] = useState<QuestionVM | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [guessedOption, setGuessedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hämta fråga + korrekt svar när servern byter questionId
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setGuessed(false);
        setGuessedOption(null);

        const data = await getQuestionAndOptions(round.questionId);
        if (!alive) return;

        if (!Array.isArray(data) || data.length === 0) {
          setQuestion(null);
          setError("Ingen fråga hittades.");
          return;
        }

        setQuestion({
          text: data[0].question ?? "Okänd fråga",
          options: shuffle(data.map(d => d.option_text).filter(Boolean)),
        });

        const correct = await getCorrectAnswer(round.questionId);
        if (!alive) return;
        setCorrectAnswer(correct.option_text);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? (e.message ?? "Kunde inte hämta fråga.") : "Kunde inte hämta fråga.");
        setQuestion(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [round.questionId]);

  const handleGuess = useCallback((opt: string) => {
    if (guessed || round.phase !== "question") return;
    setGuessed(true);
    setGuessedOption(opt);
    onAnswer?.(opt); // skicka svaret till servern om du vill
  }, [guessed, round.phase, onAnswer]);

  return (
    <Card>
      {loading && <div>Laddar fråga…</div>}
      {error && <div className="text-red-600">Fel: {error}</div>}
      {!loading && !question && !error && <div>Väntar på nästa fråga…</div>}

      {question && (
        <>
          <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
            {question.text}
          </h1>

          <ul className="space-y-4">
            {question.options.map((opt, i) => {
              let className = "w-full";
              if (guessed || round.phase === "answer") {
                if (opt === correctAnswer) className += " bg-green-500 text-white";
                else if (opt === guessedOption && opt !== correctAnswer) className += " bg-red-500 text-white";
                else className += " bg-gray-200";
              }
              return (
                <li key={i}>
                  <Button
                    onClick={() => handleGuess(opt)}
                    disabled={guessed || round.phase !== "question"}
                    className={className}
                  >
                    {opt}
                  </Button>
                </li>
              );
            })}
          </ul>

          <Divider className="my-6" />
          <div className="text-center text-sm text-gray-600">
            {round.phase === "question" ? "Svara nu…" : "Visar svar…"}
          </div>
        </>
      )}
    </Card>
  );
}

/* =========================
   KLIENT-FALLBACK (Local)
   ========================= */
function QuestionsLocal({
  total = 5,
  onProgressChange,
  onComplete,
}: {
  total?: number;
  onProgressChange?: (answered: number, total: number) => void;
  onComplete?: () => void;
}) {
  const [ids, setIds] = useState<number[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [question, setQuestion] = useState<QuestionVM | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);

  const [guessed, setGuessed] = useState(false);
  const [guessedOption, setGuessedOption] = useState<string | null>(null);

  const advanceLockRef = useRef(false);

  // Initiera kö + progress
  useEffect(() => {
    const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
    setIds(shuffle(numbers).slice(0, Math.max(0, total)));
    setAnswered(0);
  }, [total]);

  // Rapportera progress
  useEffect(() => {
    onProgressChange?.(answered, total);
  }, [answered, total, onProgressChange]);

  // Sätt första id
  useEffect(() => {
    setCurrentId(ids.length > 0 ? ids[0] : null);
  }, [ids]);

  // Hämta fråga + korrekt svar
  useEffect(() => {
    if (currentId == null) { setQuestion(null); return; }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getQuestionAndOptions(currentId);
        if (!alive) return;

        if (!Array.isArray(data) || data.length === 0) {
          setQuestion(null);
          setError("Ingen fråga hittades.");
          return;
        }

        setQuestion({
          text: data[0].question ?? "Okänd fråga",
          options: shuffle(data.map(d => d.option_text).filter(Boolean)),
        });

        const correct = await getCorrectAnswer(currentId);
        if (!alive) return;
        setCorrectAnswer(correct.option_text);

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
    return () => { alive = false; };
  }, [currentId]);

  const nextQuestion = useCallback(() => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;

    setAnswered(a => Math.min(total, a + 1));

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

  // Auto-advance baserat på QuizTime (lokalt läge)
  useEffect(() => {
    const interval = setInterval(() => {
      const timer = (window as WindowWithQuizTimer).quizTimer;
      if (!timer || advanceLockRef.current) return;
      const qDone = timer.phase === "question" && timer.timeLeft === 0;
      const aDone = timer.phase === "answer" && timer.timeLeft === 0;
      if (qDone || aDone) nextQuestion();
    }, 250);
    return () => clearInterval(interval);
  }, [currentId, nextQuestion]);

  const handleGuess = useCallback((opt: string) => {
    setGuessed(true);
    setGuessedOption(opt);
  }, []);

  return (
    <Card>
      {loading && <div>Laddar fråga…</div>}
      {error && <div className="text-red-600">Fel: {error}</div>}
      {!loading && !question && !error && <div>Väntar på fråga…</div>}

      {question && (
        <>
          <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
            {question.text}
          </h1>

          <ul className="space-y-4">
            {question.options.map((opt, i) => {
              let className = "w-full";
              if (guessed) {
                if (opt === correctAnswer) className += " bg-green-500 text-white";
                else if (opt === guessedOption && opt !== correctAnswer) className += " bg-red-500 text-white";
                else className += " bg-gray-200";
              }
              return (
                <li key={i}>
                  <Button onClick={() => handleGuess(opt)} disabled={guessed} className={className}>
                    {opt}
                  </Button>
                </li>
              );
            })}
          </ul>

          <Divider className="my-6" />
          <Button onClick={nextQuestion} disabled={advanceLockRef.current || loading} className="w-full">
            Nästa Fråga
          </Button>
        </>
      )}
    </Card>
  );
}
