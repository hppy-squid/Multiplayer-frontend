import { API_BASE } from "./config";

// Bas-URL från env
const BASE = `${API_BASE}/question`;

// Svarsalternativ från API:t
export interface ApiQuestionOption {
  question: string;
  option_text: string;
}

// Rätt svar från API:t
export interface ApiCorrectAnswer {
  option_text: string;
}

// Hjälp: är värdet ett objekt?
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// Hjälp: validera ett QuestionOption-objekt
function isApiQuestionOption(v: unknown): v is ApiQuestionOption {
  return isRecord(v) && typeof v.question === "string" && typeof v.option_text === "string";
}

// Hjälp: validera ett CorrectAnswer-objekt
function isApiCorrectAnswer(v: unknown): v is ApiCorrectAnswer {
  return isRecord(v) && typeof v.option_text === "string";
}

// Hämta fråga + alternativ för ett givet id, och validera svaret
export async function getQuestionAndOptions(questionId: number): Promise<ApiQuestionOption[]> {
  const res = await fetch(`${BASE}/questionAndOptions?question_id=${questionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  // Säkerställ att det är en array och att varje post är korrekt typ
  if (!Array.isArray(json) || !json.every(isApiQuestionOption)) {
    throw new Error("Felaktigt payloadformat från questionAndOptions");
  }
  return json;
}

// Hämta rätt svar för ett id, och validera svaret
export async function getCorrectAnswer(questionId: number): Promise<ApiCorrectAnswer> {
  const res = await fetch(`${BASE}/correctAnswer?question_id=${questionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  // Säkerställ att objektet har option_text
  if (!isApiCorrectAnswer(json)) {
    throw new Error("Felaktigt payloadformat från correctAnswer");
  }
  return json;
}