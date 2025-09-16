/**
 * Filens syfte:
 *
 * Denna fil samlar alla typer som används i lobby- och spel-flödet.
 * - Delar upp typer i tre kategorier:
 *   1. Router state: data som skickas via `navigate` i React Router.
 *   2. UI-typer: modeller anpassade för frontend-komponenterna.
 *   3. Server-typer: exakt struktur på det backend skickar.
 *
 * Detta gör koden mer robust och tydlig, eftersom vi alltid vet
 * vilken typ av data vi arbetar med i olika delar av appen.
 */


// --- Router state (det du skickar via navigate) ---
export type LobbyLocationState = {
   isHost?: boolean;              // om användaren är värd
  playerId?: number;             // spelarens id
  playerName?: string;           // spelarens namn
  initialPlayers?: ServerPlayer[]; // snapshot från servern
  gameState?: GameState;         // nuvarande spelstatus
};

// --- UI-typer (vad komponenterna använder) ---
export type GameState = "WAITING" | "IN_PROGRESS" | "IN_GAME" | "FINISHED";

export type PlayerDTO = {
  id: string;          // id konverterat till string för UI
  playerName: string;
  score: number;
  isHost: boolean;
  ready: boolean;
};

export type LobbyDTO = {
   id: number | null;       // lobby-id (kan vara null om lobby stängs)
  lobbyCode: string;       // lobbykoden
  maxPlayer?: number;      // max antal spelare (optional i backend)
  lock?: boolean;          // om lobbyn är låst (optional i backend)
  gameState: GameState;    // status på spelet
  players: PlayerDTO[];    // lista över spelare i lobbyn (UI-modell)
};

// --- Server-typer (exakt vad backend skickar) ---
export type ServerPlayer = {
  id: number;               // numeriskt id från servern
  playerName: string;
  score: number;
  isHost: boolean;
  ready?: boolean;          // optional (kan saknas i vissa svar)
};

export type ServerLobbyDTO = {
  id: number;              // lobby-id från servern
  lobbyCode: string;       // lobbykoden
  gameState: GameState;    // status på spelet
  players: ServerPlayer[]; // lista över spelare från servern
};

export type RoundPhase = "question" | "answer";

export type RoundState = {
  index: number;        // 0..total-1
  total: number;        // t.ex. 5
  questionId: number;   // den fråga alla ska se
  phase: RoundPhase;    // "question" | "answer"
  endsAt: number;       // epoch millis (serverns deadline)
  answeredCount: number;// hur många som har svarat
};

export type LobbySnapshotDTO = {
  players: ServerPlayer[];
  gameState: GameState; // WAITING | IN_GAME | FINISHED
  round?: RoundState;   // finns bara när IN_GAME
};