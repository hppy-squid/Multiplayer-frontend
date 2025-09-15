/**
 * Filens syfte:
 * 
 * Den här filen ansvarar för att skapa en spelare.
 * Den kan:
 * - Skapa en spelare via backend och returnera ett playerId
 * - Om backend inte är igång, mocka fram ett playerId lokalt
 */

import { API_BASE, USE_BACKEND } from "./config";

// Typdefinition för svaret som backend returnerar vid skapande av spelare
export type CreatePlayerResponse = { playerId: string };

/**
 * Skapar en spelare.
 * - Om USE_BACKEND är true skickas ett POST-anrop till backend.
 * - Annars returneras ett mockat id (random UUID).
 */
export async function createPlayer(playerName: string): Promise<CreatePlayerResponse> {
  // Förbered request-body: trimma bort whitespace från playerName
  const body = JSON.stringify({ playerName: playerName.trim() });

  if (USE_BACKEND) {
    // Skicka POST-anrop till backend för att skapa spelare
    const res = await fetch(`${API_BASE}/player/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    // Om backend svarar med fel, kasta ett error med svarets text
    if (!res.ok) throw new Error(await res.text());

    // Om allt går bra, parsa JSON och returnera playerId
    const data: CreatePlayerResponse = await res.json();
    return data; // { playerId }
  }

   // Om backend inte används, mocka ett id lokalt med random UUID
  return { playerId: crypto.randomUUID() };
}