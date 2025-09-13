import { useState, type FormEvent } from "react";
import {
  createLobby,              
  isBackendConfigured,      
  BACKEND_NOT_ENABLED_MSG,  
  FIXED_MAX_PLAYERS,        
} from "../../api/lobby";

type Props = { name: string; onCreated: (code: string) => void };

/**
 * CreateLobbyForm
 * Enkel form som skapar en lobby åt hosten.
 * - Avbryter om backend saknas eller namnet är tomt.
 * - Returnerar lobbykoden via onCreated för navigation i föräldern.
 */
export function CreateLobbyForm({ name, onCreated }: Props) {

  // hindrar dubbelklick/duplicerade requests
  const [submitting, setSubmitting] = useState(false);

  // Submit-handler för att skapa lobby
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

      // Låt föräldern bestämma navigation (t.ex. /lobby/:code)
      onCreated(lobbyCode);
    } catch (err) {
      // När backend saknas kastar createLobby ett tydligt fel
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
        className={`mt-4 w-full rounded-lg px-4 py-2 text-white ${!isBackendConfigured || submitting || !name.trim()
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700"
          }`}
      >
        {submitting ? "Creating..." : "Create Lobby"}
      </button>
    </form>
  );
}