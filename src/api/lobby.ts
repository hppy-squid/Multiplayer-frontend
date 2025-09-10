import type { LobbyDTO } from "../types";
import { API_BASE, USE_BACKEND, IS_DEV, TEST_CODE } from "./config";

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
  hostName: string;
  maxPlayer?: number;
};

export type CreateLobbyResponse = {
  lobbyCode: string;
};

export type JoinLobbyRequest = {
  lobbyCode: string;
  playerName: string;
};

export type JoinLobbyResponse = {
  lobbyCode: string;   // bekräftar vilken lobby vi hamnade i
};

/** Skapar en ny lobby på backend. Kräver backend, returnerar { lobbyCode }. */
export async function createLobby(
  payload: CreateLobbyRequest
): Promise<CreateLobbyResponse> {
  // Säkerhetscheck: kör inte utan backend
  if (!isBackendConfigured) throw new Error(BACKEND_NOT_ENABLED_MSG);

  // Skapa lobby via backend
  const res = await fetch(`${BASE}/lobbies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  // Felhantering
  if (!res.ok) throw new Error("Failed to create lobby");
  return res.json();
}


/**
 * Går med i en lobby via kod.
 * - I dev-läge utan backend: tillåter test code (123456).
 * - Annars: kräver backend. Returnerar { lobbyCode }.
 */
export async function joinLobby(
  payload: JoinLobbyRequest
): Promise<JoinLobbyResponse> {
  // Testkod funkar endast i dev och när backend inte används
  if (IS_DEV && !USE_BACKEND) {
    const input = (payload.lobbyCode ?? "").trim();
    if (input === TEST_CODE) {
      return { lobbyCode: TEST_CODE };
    }
  }
  // Annars krävs backend
  if (!USE_BACKEND) throw new Error(BACKEND_NOT_ENABLED_MSG);

  // Join via backend
  const res = await fetch(
    `${BASE}/lobbies/${encodeURIComponent(payload.lobbyCode)}/join`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: payload.playerName }),
    }
  );
  if (!res.ok) throw new Error("Failed to join lobby");
  return res.json();
}

// ------- Waiting room helpers -------

/** Hämtar en lobby (spelare, status, mm.). Kräver backend. */
export async function getLobby(lobbyCode: string): Promise<LobbyDTO> {
  // Kräver backend (GET på en lobby)
  if (!isBackendConfigured) throw new Error(BACKEND_NOT_ENABLED_MSG);

  const res = await fetch(`${BASE}/lobbies/${encodeURIComponent(lobbyCode)}`);
  if (!res.ok) throw new Error("Failed to get lobby");
  return res.json();
}

/**
 * Togglar min “ready”-status i en lobby. Kräver backend.
 * Skicka med playerId eller playerName (eller båda) beroende på vad backend kräver.
 * Returnerar uppdaterad LobbyDTO.
 */
export async function toggleReady(
  lobbyCode: string,
  playerId?: string,
  playerName?: string
): Promise<LobbyDTO> {
  // Kräver backend (POST: toggle ready)
  if (!isBackendConfigured) throw new Error(BACKEND_NOT_ENABLED_MSG);

  // Skicka med id/namn om du har dem (backend kan kräva minst ett)
  const body: Record<string, unknown> = {};
  if (playerId) body.playerId = playerId;
  if (playerName) body.playerName = playerName;

  const res = await fetch(
    `${BASE}/lobbies/${encodeURIComponent(lobbyCode)}/ready-toggle`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error("Failed to toggle ready");
  return res.json();
}

/** Startar spelet i en lobby. Kräver backend. */
export async function startGame(lobbyCode: string): Promise<void> {
  // Kräver backend (POST: start game)
  if (!isBackendConfigured) throw new Error(BACKEND_NOT_ENABLED_MSG);

  const res = await fetch(
    `${BASE}/lobbies/${encodeURIComponent(lobbyCode)}/start`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to start game");
}

/** Låter en spelare lämna en lobby. Kräver backend. */
export async function leaveLobby(
  lobbyCode: string,
  playerId?: string,
  playerName?: string
): Promise<void> {
  // Kräver backend (POST: lämna lobby)
  if (!isBackendConfigured) throw new Error(BACKEND_NOT_ENABLED_MSG);

  const res = await fetch(
    `${BASE}/lobbies/${encodeURIComponent(lobbyCode)}/leave`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, playerName }),
    }
  );
  if (!res.ok) throw new Error("Failed to leave lobby");
}