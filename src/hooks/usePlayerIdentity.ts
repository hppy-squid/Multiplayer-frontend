/******************************************************
 * Hook: usePlayerIdentity
 * Håller reda på spelarens identitet (id + namn)
 ******************************************************/



import { useEffect} from "react";
import type { LobbyLocationState } from "../types/types";

/**
 * usePlayerIdentity
 * Hook för att läsa ut och persistera spelarens id + namn.
 */
export function usePlayerIdentity(state?: LobbyLocationState) {
  // Id från navigation state (om satt)
  const navId = state?.playerId;

  // Id från storage (för fallback)
  const storedIdStr =
    sessionStorage.getItem("playerId") ?? localStorage.getItem("playerId");
  const storedId =
    storedIdStr && /^\d+$/.test(storedIdStr) ? Number(storedIdStr) : undefined;

  // Bestäm slutligt id (state prioriteras över storage)
  const myIdNum = typeof navId === "number" ? navId : storedId;
  const myIdStr = myIdNum !== undefined ? String(myIdNum) : "";

  // Hämta namn (prioriteringsordning: state → session → local)
  const rawName =
    state?.playerName ??
    sessionStorage.getItem("playerName") ??
    localStorage.getItem("playerName") ??
    "";
  const myName = String(rawName ?? "").trim() || "Player";

  // Om vi kom via navigation → persistera i sessionStorage
  useEffect(() => {
    if (typeof navId === "number") sessionStorage.setItem("playerId", String(navId));
    if (myName) sessionStorage.setItem("playerName", myName);
  }, [navId, myName]);

  return { myIdNum, myIdStr, myName };
}