/******************************************************
 * Websocket endpoints
 * Talar om hur frontend kommunicerar över Websockets
 *****************************************************/

// Bas-URL för WebSocket (från .env)
export const WS_BASE =
  import.meta.env.VITE_WS_BASE;

// Endpoints för att SKICKA meddelanden till servern
export const APP = {
  READY:       (code: string) => `/app/game/${code}/ready`,
  START:       (code: string) => `/app/game/${code}/start`,
  ANSWER:      (code: string) => `/app/game/${code}/answer`,
  RESET_READY: (code: string) => `/app/lobby/${code}/resetReady`,
  RESYNC:      (code: string) => `/app/lobby/${code}/resync`,
};

// Endpoints för att LYSSNA på serverns uppdateringar
export const TOPIC = {
  LOBBY: (code: string) => `/lobby/${code}`,
};