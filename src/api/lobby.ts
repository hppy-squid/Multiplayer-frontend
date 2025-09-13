import { API_BASE, USE_BACKEND } from "./config";
import type { ServerLobbyDTO } from "../types/types";

// Bas-URL från env
const BASE = API_BASE;

// Flagga för att kunna disabla UI tills backend är på
export const isBackendConfigured = USE_BACKEND;

// Max antal spelare
export const FIXED_MAX_PLAYERS = 4;

// Gemensamt felmeddelande när backend saknas
export const BACKEND_NOT_ENABLED_MSG =
  "Kunde inte skapa/join:a lobby ännu. Sätt VITE_API_BASE och avkommentera fetchen.";


// ------- Create / Join -------

export type CreateLobbyRequest = {
  /** Backend kräver playerId i path */
  playerId: number | string;
};

export type JoinLobbyRequest = {
  /** Kod som användaren anger */
  lobbyCode: string;
  /** Backend kräver playerId i path */
  playerId: number | string;
};

// === Helpers ===
async function ensureBackend() {
  if (!isBackendConfigured) throw new Error(BACKEND_NOT_ENABLED_MSG);
}

/** Läser svarstexten för bättre felmeddelanden vid 4xx/5xx. */
async function parseJsonOrThrow(res: Response, context: string) {
  const text = await res.text();
  if (!res.ok) {
    // Skicka med body i felet för enkel felsökning i UI
    throw new Error(`${context} ${res.status}: ${text || "(no body)"}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${context} ${res.status}: Invalid JSON body`);
  }
}

// === API-funktioner ===

/**
 * Skapar en ny lobby.
 * Backend: POST /api/lobby/create/{playerId}
 * Returnerar hela lobbyn från servern (ServerLobbyDTO).
 */
export async function createLobby(
  { playerId }: CreateLobbyRequest
): Promise<ServerLobbyDTO> {
  await ensureBackend();

  const url = `${BASE}/lobby/create/${encodeURIComponent(String(playerId))}`;
  const res = await fetch(url, { method: "POST" });
  return (await parseJsonOrThrow(res, "POST /lobby/create")) as ServerLobbyDTO;
}

/**
 * Går med i befintlig lobby.
 * Backend: POST /api/lobby/join/{lobbyCode}/{playerId}
 * Returnerar hela lobbyn (ServerLobbyDTO).
 */
export async function joinLobby(
  { lobbyCode, playerId }: JoinLobbyRequest
): Promise<ServerLobbyDTO> {
  await ensureBackend();

  const url = `${BASE}/lobby/join/${encodeURIComponent(lobbyCode)}/${encodeURIComponent(String(playerId))}`;
  const res = await fetch(url, { method: "POST" });
  return (await parseJsonOrThrow(res, "POST /lobby/join")) as ServerLobbyDTO;
}

/**
 * Hämta lobby via ID
 * Backend: GET /api/lobby/find/{lobbyId}
 */
export async function getLobbyById(
  lobbyId: number | string
): Promise<ServerLobbyDTO> {
  await ensureBackend();

  const url = `${BASE}/lobby/find/${encodeURIComponent(String(lobbyId))}`;
  const res = await fetch(url);
  return (await parseJsonOrThrow(res, "GET /lobby/find")) as ServerLobbyDTO;
}

