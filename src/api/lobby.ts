/**********************************************************************
 * API-anrop för att hantera lobbys (spelsessioner).
 **********************************************************************/

import { API_BASE, USE_BACKEND } from "./config";
import type { ServerLobbyDTO } from "../types/types";

// Bas-URL från config (hämtas från .env)
// const BASE = API_BASE;

// Flagga som anger om backend är påslagen
// export const isBackendConfigured = USE_BACKEND;

// Max antal spelare per lobby
// export const FIXED_MAX_PLAYERS = 4;


// Gemensamt felmeddelande om backend inte är igång
export const BACKEND_NOT_ENABLED_MSG =
  "Kunde inte skapa/join:a lobby ännu. Sätt VITE_API_BASE och avkommentera fetchen.";


// ------- Request-typer -------

// Data som skickas till backend när man skapar en lobby
export type CreateLobbyRequest = {
  playerId: number | string;
};

// Data som skickas till backend när man joinar en lobby
export type JoinLobbyRequest = {
  lobbyCode: string;
  playerId: number | string;
};

// ------- Hjälpfunktioner -------

// Säkerställ att backend är igång, annars kasta fel
async function ensureBackend() {
  if (!USE_BACKEND) throw new Error(BACKEND_NOT_ENABLED_MSG);
}

/**
 * Läser svaret som text, kastar informativt fel vid 4xx/5xx,
 * och returnerar parsad JSON vid OK-svar.
 */
async function parseJsonOrThrow(res: Response, context: string) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${context} ${res.status}: ${text || "(no body)"}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${context} ${res.status}: Invalid JSON body`);
  }
}

// ------- API-anrop -------

/**
 * Skapar en ny lobby på servern för en spelare.
 * Returnerar hela Lobby-objektet.
 */
export async function createLobby(
  { playerId }: CreateLobbyRequest
): Promise<ServerLobbyDTO> {
  await ensureBackend();

  const url = `${API_BASE}/lobby/create/${encodeURIComponent(String(playerId))}`;
  const res = await fetch(url, { method: "POST" });
  return (await parseJsonOrThrow(res, "POST /lobby/create")) as ServerLobbyDTO;
}

/**
 * Joinar en befintlig lobby.
 * Returnerar hela Lobby-objektet.
 */
export async function joinLobby(
  { lobbyCode, playerId }: JoinLobbyRequest
): Promise<ServerLobbyDTO> {
  await ensureBackend();

  const url = `${API_BASE}/lobby/join/${encodeURIComponent(lobbyCode)}/${encodeURIComponent(String(playerId))}`;
  const res = await fetch(url, { method: "POST" });
  return (await parseJsonOrThrow(res, "POST /lobby/join")) as ServerLobbyDTO;
}

/**
 * Hämtar en lobby via ID.
 * Backend: GET /api/lobby/find/{lobbyId}
 */
export async function getLobbyById(
  lobbyId: number | string
): Promise<ServerLobbyDTO> {
  await ensureBackend();

  const url = `${API_BASE}/lobby/find/${encodeURIComponent(String(lobbyId))}`;
  const res = await fetch(url);
  return (await parseJsonOrThrow(res, "GET /lobby/find")) as ServerLobbyDTO;
}

/**
 * Låter spelare lämna en lobby.
 * Returnerar den uppdaterade lobbyn, eller id=null om lobbyn blev tom.
 */
export async function leaveLobby(params: { lobbyCode: string; playerId: number }) {
  const res = await fetch(`${API_BASE}/lobby/leave/${params.lobbyCode}/${params.playerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Leave failed");
  }
  return (await res.json()) as {
    id: number | null;
    lobbyCode: string;
    players: Array<{ id: number; playerName: string; isHost: boolean; ready?: boolean; score?: number }>;
    gameState: string;
  };
}

/**
 * Nollställer allas "ready" i lobbyn (server-side).
 * Används t.ex. vid "Play Again".
 *
 */
export async function resetLobbyReady(lobbyCode: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lobby/${encodeURIComponent(lobbyCode)}/ready/reset`, {
    method: "POST",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Reset ready failed (${res.status}): ${t || res.statusText}`);
  }
}

