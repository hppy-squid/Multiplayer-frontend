import { createPlayer } from "./player";

/**
 * Säkerställer att det finns en "current player" i denna flik.
 * Returnerar alltid { playerId, playerName }.
 */
export async function ensurePlayer(
  rawName: string
): Promise<{ playerId: string; playerName: string }> {
  // 1) Bestäm namn: ta inmatat namn, annars tidigare sparat, annars "Player"
  const playerName = (rawName || sessionStorage.getItem("playerName") || "Player").trim();

  // 2) Försök läsa ett befintligt playerId från denna flik (sessionStorage)
  let playerId = sessionStorage.getItem("playerId");

  // 3) Om inget finns: skapa spelare (backend eller mock i createPlayer) och få ett nytt id
  if (!playerId) {
    const res = await createPlayer(playerName);
    playerId = res.playerId;
  }

  // 4) Spara/uppdatera identiteten i sessionStorage (gäller per flik)
  sessionStorage.setItem("playerId", playerId);
  sessionStorage.setItem("playerName", playerName);

  // 5) Returnera stabil identitet för resten av appen
  return { playerId, playerName };
}

/**
 * Varför sessionStorage?
 * - Lagrar data per flik/fönster (andra flikar ser inte värdet).
 * - Överlever reload men rensas när fliken stängs.
 * - Perfekt för playerId i dev, så två öppna flikar blir två olika spelare.
 */