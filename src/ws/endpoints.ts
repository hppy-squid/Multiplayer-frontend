/**
 * Filens syfte:
 *
 * Denna fil samlar konstanter för WebSocket-kommunikation.
 * - Definierar bas-URL för WS-anslutning (från .env eller fallback localhost).
 * - Grupperar alla endpoints i två kategorier:
 *   1. APP: används när klienten skickar meddelanden till servern.
 *   2. TOPIC: används när klienten prenumererar på serverns uppdateringar.
 *
 * Detta gör det enkelt att hålla koll på alla WS-kanaler och
 * undvika hårdkodade strängar utspridda i koden.
 */

// Bas-URL för WebSocket (från .env eller fallback till localhost)
export const WS_BASE =
  import.meta.env.VITE_WS_BASE || "https://seal-app-9djqw.ondigitalocean.app/ws";

// Endpoints för att SKICKA meddelanden till servern
export const APP = {
  READY:    (code: string) => `/app/game/${code}/ready`,
  RESPONSE: (code: string) => `/app/game/${code}/response`,
  START:    (code: string) => `/app/game/${code}/start`, 
};

// Endpoints för att LYSSNA på serverns uppdateringar
export const TOPIC = {
  READY:    (code: string) => `/readycheck/${code}`,
  RESPONSE: (code: string) => `/response/${code}`,
  LOBBY:    (code: string) => `/lobby/${code}`,  
};