import { useMemo, useState, type FormEvent } from "react";
import { joinLobby } from "../../api/lobby";

type Props = {
  name: string;
  onJoined: (code: string) => void;
};

// Testkod som alltid ska fungera i dev-läge om backend inte används
const TEST_CODE = (import.meta.env.VITE_TEST_LOBBY_CODE as string) || "123456";
const IS_DEV = import.meta.env.DEV;

export function JoinLobbyForm({ name, onJoined }: Props) {
  // Lokalt state för det som skrivs in i kodfältet
  const [lobbyCode, setLobbyCode] = useState("");
  // Håller reda på om vi just nu skickar en request
  const [submitting, setSubmitting] = useState(false);

  // Normalisera användarens input: ta bort mellanslag i början/slutet
  const normalizedCode = useMemo(
    () => lobbyCode.replace(/\s+/g, "").trim(),
    [lobbyCode]
  );

  // I dev: knappen aktiv endast när exakt 123456
  // I prod: aktiv när fältet inte är tomt
  const canSubmit =
    !submitting && (IS_DEV ? normalizedCode === TEST_CODE : normalizedCode.length > 0);

  // Hanterar submit av formuläret
  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Dev-läge: hoppa över backend och acceptera TEST_CODE direkt
      if (IS_DEV && normalizedCode === TEST_CODE) {
        await new Promise((r) => setTimeout(r, 100)); // liten fördröjning för realism
        onJoined(TEST_CODE);
        return;
      }

       // Prod-läge: anropa backend för att joina lobby
      const { lobbyCode: code } = await joinLobby({
        lobbyCode: normalizedCode,
        playerName: (name ?? "").trim(),
      });
      onJoined(code); // meddela föräldern att vi lyckats joina
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte joina lobby.";
      console.error(err);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-6" onSubmit={handleJoin}>
       {/* Hint som visas i dev-läge */}
      {IS_DEV && (
        <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Dev-läge: skriv exakt <code>{TEST_CODE}</code> för att aktivera knappen.
        </div>
      )}

      {/* Inputfält för lobbykod */}
      <label className="block text-sm font-medium text-gray-700 mb-1">Lobbykod</label>
      <input
        value={lobbyCode}
        onChange={(e) => setLobbyCode(e.target.value)}
        placeholder={IS_DEV ? `skriv ${TEST_CODE}` : "t.ex. ABCD"}
        className="w-full mb-2 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        autoComplete="off"
        spellCheck={false}
        inputMode="numeric"
      />

      {/* Submit-knapp: aktiv/inaktiv beroende på canSubmit */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{ position: "relative", zIndex: 1 }}
        className={`w-full rounded-lg px-4 py-2 text-white ${
          !canSubmit ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {submitting ? "Joining..." : "Join Lobby"}
      </button>
    </form>
  );
}