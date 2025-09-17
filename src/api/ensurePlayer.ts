/**************************************************************************
 * Säkerställer att det alltid finns en spelare koppat till frontend.
 **************************************************************************/


import { API_BASE } from "./config";


type CreatePlayerResponse = { id: number; playerName: string; score?: number; isHost?: boolean };

/**
 * Steg:
 * 1) Kolla om det redan finns en spelare i sessionStorage.
 * 2) Om inte, skapa en ny spelare via backend.
 * 3) Spara tillbaka spelarens id och namn i sessionStorage.
 */
export async function ensurePlayer(
  name: string
): Promise<{ playerId: number; playerName: string }> {
  // 1) Försök återanvända redan skapad spelare under denna browser-session
  const savedId = sessionStorage.getItem("serverPlayerId");
  const savedName = sessionStorage.getItem("serverPlayerName");

  
  if (savedId && savedName) {
    // Debug-logg: visar att vi återanvänder sparad spelare
    console.log("[ensurePlayer] reuse", { playerId: savedId, playerName: savedName });
    return { playerId: Number(savedId), playerName: savedName };
  }

  // 2) Skapa en ny spelare via backend
  // Bygg URL (API_BASE hämtas från config och i sin tur från .env)
  const url = `${API_BASE}/player/create`;

  // Trimma namnet. Om inget namn skickas används "Player" som standard.
  const body = { playerName: (name || "Player").trim() };
  
  // Debug-logg
  console.log("[ensurePlayer] POST", url, body);

  // Skicka POST-anropet till backend
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Läs svaret som råtext för att kunna logga och visa bättre felmeddelanden
  const text = await res.text();
  console.log("[ensurePlayer] response", res.status, text);

  // Hantera fel från backend
  if (!res.ok) throw new Error(`POST /player/create ${res.status}: ${text || "(no body)"}`);

  // Om svaret var OK, parsa JSON
  const dto: CreatePlayerResponse = JSON.parse(text);

  // Spara spelarens id och namn i sessionStorage för att återanvända
  sessionStorage.setItem("serverPlayerId", String(dto.id));
  sessionStorage.setItem("serverPlayerName", dto.playerName);
  
  return { playerId: dto.id, playerName: dto.playerName };
}
