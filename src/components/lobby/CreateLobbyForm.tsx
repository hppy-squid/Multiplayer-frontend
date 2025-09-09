import { useState, type FormEvent } from "react";
import {
  createLobby,              // API-anrop (utkommenterat i implementation tills backend finns)
  isBackendConfigured,      // true om VITE_API_BASE finns
  BACKEND_NOT_ENABLED_MSG,  // feltext när backend saknas
  FIXED_MAX_PLAYERS,        // alltid 4 spelare
} from "../../api/lobby";

type Props = { name: string; onCreated: (code: string) => void };

/**
 * CreateLobbyForm
 * Skapar en ny lobby åt hosten.
 *  - Låst till 4 spelare (FIXED_MAX_PLAYERS).
 *  - UI är avstängt tills backend är konfigurerad (isBackendConfigured).
 */

export function CreateLobbyForm({ name, onCreated }: Props) {

  // hindrar dubbelklick/duplicerade requests
  const [submitting, setSubmitting] = useState(false);             

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    // Kör inte om namnet är tomt, backend ej satt, eller vi redan skickar
    if (!name.trim() || !isBackendConfigured || submitting) return;

    
    setSubmitting(true);
    try {
      /// Skicka hostens namn + fast maxantal (4)
      const { lobbyCode } = await createLobby({
        hostName: name.trim(),
        maxPlayer: FIXED_MAX_PLAYERS,
      });

      // Förälder avgör navigation (t.ex. navigate(`/lobby/${lobbyCode}`))
      onCreated(lobbyCode);
    } catch (err) {
      // Tills backend kopplas in kastar createLobby ett tydligt fel
      console.error(err);
      alert(BACKEND_NOT_ENABLED_MSG);
    } finally {
      // Återställ submit-lås
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-4" onSubmit={handleCreate}>
      
       {/* Hint om att backend måste konfigureras */}
      {!isBackendConfigured && (
        <p className="text-xs text-gray-500 mb-2">
          Backend är inte konfigurerat. Sätt <code>VITE_API_BASE</code> i din{" "}
          <code>.env</code>.
        </p>
      )}

      {/* knapp: avstängd utan backend, vid submit eller tomt namn */}
      <button
        type="submit"
        disabled={!isBackendConfigured || submitting || !name.trim()}
        className={`w-full rounded-lg px-4 py-2 text-white ${
          !isBackendConfigured || submitting || !name.trim()
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {submitting ? "Creating..." : "Create Lobby"}
      </button>
    </form>
  );
}