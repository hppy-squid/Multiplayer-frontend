// --- Router state (det du skickar via navigate) ---
export type LobbyLocationState = {
  isHost?: boolean;
  playerId?: number;
  playerName?: string;
  initialPlayers?: ServerPlayer[]; // refererar till typen nedan
  gameState?: GameState;
};

// --- UI-typer (vad komponenterna använder) ---
export type GameState = "WAITING" | "IN_PROGRESS" | "IN_GAME" | "FINISHED";

export type PlayerDTO = {
  id: string;          // UI-id som string
  playerName: string;
  score: number;
  isHost: boolean;
  ready: boolean;
};

export type LobbyDTO = {
  id: number | null;
  lobbyCode: string;
  // Dessa två finns inte alltid i backend—gör dem gärna optional:
  maxPlayer?: number;
  lock?: boolean;
  gameState: GameState;
  players: PlayerDTO[];
};

// --- Server-typer (exakt vad backend skickar) ---
export type ServerPlayer = {
  id: number;
  playerName: string;
  score: number;
  isHost: boolean;
  ready?: boolean;
};

export type ServerLobbyDTO = {
  id: number;
  lobbyCode: string;
  gameState: GameState;
  players: ServerPlayer[];
};