/**
 * Filens syfte:
 * 
 * Den här filen ansvarar för att hämta quizfrågor och svarsalternativ från backend.
 * Den kan:
 * - Hämta en fråga med tillhörande svarsalternativ
 * - Hämta rätt svar till en fråga
 * - Validera att datat från backend har korrekt format
 */

import { API_BASE } from "./config";

// Bas-URL för alla fråge-relaterade API-anrop
const BASE = `${API_BASE}/question`;

// Typ för ett svarsalternativ från API:t
export interface ApiQuestionOption {
  question: string;
  option_text: string;
}

/** Råformat för korrekt svar från backend */
export interface ApiCorrectAnswerRaw {
  correctAnswer: string;
  question_id: number;
}

/** Normaliserat facit som UI förväntar sig */
export interface CorrectAnswerVM {
  option_text: string;
}


// Hjälpfunktion: kollar om värdet är ett objekt (ej null)

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Validera en rad med fråga/alternativ */
function isApiQuestionOption(v: unknown): v is ApiQuestionOption {
  return isRecord(v) && typeof v.question === "string" && typeof v.option_text === "string";
}

/** Validera rå-facit från backend */
function isApiCorrectAnswerRaw(v: unknown): v is ApiCorrectAnswerRaw {
  return (
    isRecord(v) &&
    typeof v.correctAnswer === "string" &&
    typeof v.question_id === "number"
  );
}

/**
 * Hämta fråga + alternativ för ett id.
 * Förväntar en array av { question, option_text }.
 */
export async function getQuestionAndOptions(questionId: number): Promise<ApiQuestionOption[]> {
  const res = await fetch(`${BASE}/questionAndOptions?question_id=${questionId}`);
  if (!res.ok) throw new Error(`questionAndOptions HTTP ${res.status}`);

  const json: unknown = await res.json();
  if (!Array.isArray(json) || !json.every(isApiQuestionOption)) {
    throw new Error("Felaktigt payloadformat från questionAndOptions");
  }
  return json;
}


// Hämta rätt svar för ett id, och validera svaret
export async function getCorrectAnswer(questionId: number): Promise<CorrectAnswerVM> {

  
  const res = await fetch(`${BASE}/correctAnswer?question_id=${questionId}`);
  if (!res.ok) throw new Error(`correctAnswer HTTP ${res.status}`);

  const json: unknown = await res.json();
  if (!isApiCorrectAnswerRaw(json)) {
    throw new Error("Felaktigt payloadformat från correctAnswer");
  }
  return { option_text: json.correctAnswer };
}