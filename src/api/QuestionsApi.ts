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

// Typ för ett korrekt svar från API:t
export interface ApiCorrectAnswer {
  option_text: string;
}

// Hjälpfunktion: kollar om värdet är ett objekt (ej null)
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// Hjälpfunktion: kollar om ett värde är av typen ApiQuestionOption
function isApiQuestionOption(v: unknown): v is ApiQuestionOption {
  return isRecord(v) && typeof v.question === "string" && typeof v.option_text === "string";
}

// Hjälpfunktion: kollar om ett värde är av typen ApiCorrectAnswer
function isApiCorrectAnswer(v: unknown): v is ApiCorrectAnswer {
  return isRecord(v) && typeof v.option_text === "string";
}

/**
 * Hämta fråga + svarsalternativ för ett givet id.
 * - Gör ett GET-anrop mot /questionAndOptions
 * - Validerar att svaret är en array av ApiQuestionOption
 */
export async function getQuestionAndOptions(questionId: number): Promise<ApiQuestionOption[]> {
  const res = await fetch(`${BASE}/questionAndOptions?question_id=${questionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();

  // Säkerställ att datat är en array av korrekt typ
  if (!Array.isArray(json) || !json.every(isApiQuestionOption)) {
    throw new Error("Felaktigt payloadformat från questionAndOptions");
  }
  return json;
}

/**
 * Hämta rätt svar för ett givet id.
 * - Gör ett GET-anrop mot /correctAnswer
 * - Validerar att svaret är av typen ApiCorrectAnswer
 */
export async function getCorrectAnswer(questionId: number): Promise<ApiCorrectAnswer> {
  const res = await fetch(`${BASE}/correctAnswer?question_id=${questionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: unknown = await res.json();

  // Säkerställ att objektet har rätt format
  if (!isApiCorrectAnswer(json)) {
    throw new Error("Felaktigt payloadformat från correctAnswer");
  }
  return json;
}