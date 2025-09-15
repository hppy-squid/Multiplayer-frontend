
import { useEffect, useState } from "react";

export interface QuizTimerState {
    timeLeft: number;
    phase: 'question' | 'answer';
    isRed: boolean;
}

declare global {
    interface Window {
        quizTimer?: QuizTimerState;
    }



}

export function QuizTime() {
    const [timeLeft, setTimeLeft] = useState(15);
    const [phase, setPhase] = useState<'question' | 'answer'>('question');
    const [isRed, setIsRed] = useState(false);

    // När det är 3 sekunder kvar så blir texten röd
    useEffect(() => {
        setIsRed(timeLeft <= 3 && phase === 'question');
    }, [timeLeft, phase]);

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Tiden är slut
                    if (phase === 'question') {
                        // Gå till svar-fas (10 sekunder)
                        setPhase('answer');
                        setTimeLeft(10);
                        return 10;
                    } else {
                        // Detta är slutet av svar-fasen, starta om till fråga (15 sekunder).
                        // Men detta hanteras av föräldrakomponenten som byter fråga.
                        // Här återställer vi bara timern.
                        setPhase('question');
                        setTimeLeft(15);
                        return 15;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, phase]);

    // Exponera state globalt så att andra komponenter kan läsa det
    useEffect(() => {
        window.quizTimer = {
            timeLeft,
            phase,
            isRed
        };
    }, [timeLeft, phase, isRed]);

    const getPhaseText = () => {
        return phase === 'question' ? 'Svarar...' : 'Visar svar';
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="text-sm text-gray-600 mb-2">{getPhaseText()}</div>

            <div
                className={`text-3xl font-bold transition-colors duration-300 ${
                    isRed ? 'text-red-500' : 'text-gray-800'
                }`}
            >
                {timeLeft}s
            </div>
        </div>
    );
}