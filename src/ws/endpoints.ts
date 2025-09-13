export const WS_BASE =
  import.meta.env.VITE_WS_BASE || "http://localhost:8080/ws";

export const APP = {
  READY:    (code: string) => `/app/game/${code}/ready`,
  RESPONSE: (code: string) => `/app/game/${code}/response`,
};

export const TOPIC = {
  READY:    (code: string) => `/readycheck/${code}`,
  RESPONSE: (code: string) => `/response/${code}`,
  LOBBY:    (code: string) => `/lobby/${code}`,  
};