// När backend är på plats: sätt VITE_API_BASE i .env och
// avkommentera fetch-blocket i createLobby().

const BASE = import.meta.env.VITE_API_BASE || "";

// Liten hjälpare att kunna disabla UI tills backend är konfigurerad
export const isBackendConfigured = BASE.length > 0;

// Max antal spelare
export const FIXED_MAX_PLAYERS = 4;

export const BACKEND_NOT_ENABLED_MSG =
  "Kunde inte skapa lobby ännu. Sätt VITE_API_BASE och avkommentera fetch i createLobby().";

export type CreateLobbyRequest = {
  hostName: string;
  // maxPlayer finns som optional för kompatibilitet
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
  lobbyCode: string;
  // ev. fler fält, t.ex. players etc.
};

export async function createLobby(
  payload: CreateLobbyRequest
): Promise<CreateLobbyResponse> {
  // Avkommentera när backend är redo:
  // const res = await fetch(`${BASE}/lobbies`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error("Failed to create lobby");
  // return res.json();

  // Tydligt fel tills backend kopplas in
  throw new Error(BACKEND_NOT_ENABLED_MSG);
}

// ---- Test-lobby setup (endast för utveckling) ----
const TEST_MODE_ENABLED = import.meta.env.DEV; // kör bara i dev
const TEST_LOBBY_CODE =
  (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";

export async function joinLobby(
  payload: JoinLobbyRequest
): Promise<JoinLobbyResponse> {
  // ---- TEST-MODE: låt koden 123456 fungera i dev utan backend ----
  if (TEST_MODE_ENABLED) {
    const input = (payload.lobbyCode ?? "").trim();
    if (input === TEST_LOBBY_CODE) {
      // Fejka lyckad join
      return Promise.resolve({ lobbyCode: TEST_LOBBY_CODE });
    }
  }

  // Avkommentera när backend är redo:
  // const res = await fetch(
  //   `${BASE}/lobbies/${encodeURIComponent(payload.lobbyCode)}/join`,
  //   {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ playerName: payload.playerName }),
  //   }
  // );
  // if (!res.ok) throw new Error("Failed to join lobby");
  // return res.json();

  // Tydligt fel tills backend kopplas in
  throw new Error(BACKEND_NOT_ENABLED_MSG);
}