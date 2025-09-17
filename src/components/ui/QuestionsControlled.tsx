// src/components/ui/QuestionsControlled.tsx
/**
 * Visar exakt den fråga som servern bestämt (via questionId).
 * Ingen lokal frågekö. Färgar svar i reveal-fasen. Skickar svar en (1) gång.
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { getQuestionAndOptions, getCorrectAnswer } from "../../api/QuestionsApi";

type Phase = "question" | "answer";

export type QuestionsControlledProps = {
    questionId: number;
    index: number;               // 0-baserat
    total: number;
    phase: Phase;                // "question" | "answer"
    onAnswer: (option: string) => void;
    myAnswered?: boolean;        // om servern flaggar att jag redan svarat (valfritt)
    answeredCount?: number;      // hur många som hunnit svara (valfritt)
};

type QuestionVM = { text: string; options: string[] };
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export function QuestionsControlled({
    questionId,
    index,
    total,
    phase,
    onAnswer,
    myAnswered = false,
    answeredCount,
}: QuestionsControlledProps) {
    const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [vm,      setVm]      = useState<QuestionVM | null>(null);
    const [correct, setCorrect] = useState<string | null>(null);

  const [picked,  setPicked]  = useState<string | null>(null);
    const sentRef = useRef(false); // skyddar mot dubbelsändning
    const hasAnswered = myAnswered || sentRef.current;

    // Hämta fråga + rätt svar när servern byter questionId
    useEffect(() => {
        let alive = true;
        setPicked(null);
        sentRef.current = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getQuestionAndOptions(questionId);
                if (!alive) return;
                if (!Array.isArray(data) || data.length === 0) throw new Error("Ingen fråga hittades.");

                setVm({
                    text: data[0].question ?? "Okänd fråga",
                    options: shuffle(data.map(d => d.option_text).filter(Boolean)),
                });

                const ca = await getCorrectAnswer(questionId);
                if (!alive) return;
                setCorrect(ca.option_text);
            } catch (e) {
                if (!alive) return;
                setError(e instanceof Error ? (e.message || "Kunde inte hämta fråga.") : "Kunde inte hämta fråga.");
                setVm(null);
                setCorrect(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [questionId]);

    const handlePick = useCallback((opt: string) => {
        if (phase !== "question") return;
        if (hasAnswered) return;
        sentRef.current = true;
        setPicked(opt);
        onAnswer(opt);
    }, [phase, hasAnswered, onAnswer]);

    const isLocked = phase !== "question" || loading || hasAnswered;

    return (
        <Card>
            {/* Progress-rad */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Question: {index + 1}/{total}</span>
                {typeof answeredCount === "number" && <span>Answers: {answeredCount}</span>}
            </div>

            {loading && <div>Loading question…</div>}
            {error && <div className="text-red-600">Fel: {error}</div>}

            {!loading && !error && vm && (
                <>
                    <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
                        {vm.text}
                    </h1>

                    <ul className="space-y-4">
                        {vm.options.map((opt, i) => {
                            let className = "w-full";

                            if (phase === "answer") {
                                if (opt === correct) className += " bg-green-500 text-white";
                                else if (picked === opt && opt !== correct) className += " bg-red-500 text-white";
                                else className += " bg-gray-200";
                            } else if (phase === "question" && picked === opt) {
                                // Ovverride disabled-gråning: ! = important
                                className += " !ring-6 !ring-blue-600 !bg-black-50";
                            }

                            return (
                                <li key={i}>
                                    <Button
                                        type="button"
                                        onClick={() => handlePick(opt)}
                                        disabled={isLocked}
                                        className={className}
                                    >
                                        {opt}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                    

                    <Divider className="my-6" />
                </>
            )}

            {!loading && !error && !vm && (
                <div className="text-center text-gray-600">Next question is on its way…</div>
            )}
        </Card>
    );
}
