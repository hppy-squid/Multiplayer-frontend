import { API_BASE } from "./config";

// DTO som backend returnerar vid skapande av spelare.
type CreatePlayerResponse = { id: number; playerName: string; score?: number; isHost?: boolean };

/**
 * Säkerställ att vi har en server-skapad spelare.
 *
 * Flöde:
 * 1) Försök återanvända playerId/playerName från sessionStorage (samma tabb-session).
 * 2) Om inget finns, POST:a till backend: /player/create med { playerName }.
 * 3) Spara tillbaka id/namn i sessionStorage för framtida anrop under denna session.
 */
export async function ensurePlayer(
  name: string
): Promise<{ playerId: number; playerName: string }> {
  // 1) Försök återanvända redan skapad spelare under denna browser-session
  const savedId = sessionStorage.getItem("serverPlayerId");
  const savedName = sessionStorage.getItem("serverPlayerName");
  // Debug-logg
  if (savedId && savedName) {
    console.log("[ensurePlayer] reuse", { playerId: savedId, playerName: savedName });
    return { playerId: Number(savedId), playerName: savedName };
  }

  // 2) Skapa en ny spelare via backend
  // Bygg URL (API_BASE kommer från .env)
  const url = `${API_BASE}/player/create`;
  // Trimma namnet och använd "Player" som fallback om inget angetts
  const body = { playerName: (name || "Player").trim() };
  // Debug-logg
  console.log("[ensurePlayer] POST", url, body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Läs råtext för att både kunna logga och ge bättre felmeddelanden
  const text = await res.text();
  console.log("[ensurePlayer] response", res.status, text);

  // Hantera 4xx/5xx från backend med tydligt fel
  if (!res.ok) throw new Error(`POST /player/create ${res.status}: ${text || "(no body)"}`);

  const dto: CreatePlayerResponse = JSON.parse(text);

  // 3) Spara id/namn i sessionStorage för återanvändning under sessionen (samma tabb)
  sessionStorage.setItem("serverPlayerId", String(dto.id));
  sessionStorage.setItem("serverPlayerName", dto.playerName);
  
  return { playerId: dto.id, playerName: dto.playerName };
}
