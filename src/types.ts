export type GameState = "WAITING" | "IN_PROGRESS" | "FINISHED";

export type PlayerDTO = {
  id: string;          // UUID
  playerName: string;
  score: number;
  isHost: boolean;
  ready: boolean;
};

export type LobbyDTO = {
  lobbyCode: string;
  maxPlayer: number;
  gameState: GameState; // WAITING/IN_PROGRESS/FINISHED
  lock: boolean;        // om true → inga fler join
  players: PlayerDTO[];
};