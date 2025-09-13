import { API_BASE, USE_BACKEND } from "./config";

export type CreatePlayerResponse = { playerId: string };

// Skapar en spelare och returnerar ett nytt playerId (via backend om tillgänglig, annars mockat id).
export async function createPlayer(playerName: string): Promise<CreatePlayerResponse> {
  const body = JSON.stringify({ playerName: playerName.trim() });

  if (USE_BACKEND) {
    const res = await fetch(`${API_BASE}/player/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) throw new Error(await res.text());
    const data: CreatePlayerResponse = await res.json();
    return data; // { playerId }
  }

   // Mock (ingen backend)
  return { playerId: crypto.randomUUID() };
}