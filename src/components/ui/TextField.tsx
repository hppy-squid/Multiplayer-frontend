/**
 * Filens syfte:
 *
 * Denna fil innehåller `TextField`-komponenten.
 * - En återanvändbar textinput med label.
 * - Kan användas för olika typer av inmatning (namn, kod osv).
 * - Ger konsekvent styling och tillgänglighet via label + id-koppling.
 */

import type { InputHTMLAttributes } from "react";

type Props = {
  id: string;   // unikt id för att koppla label → input
  label: string; // text som visas ovanför inputfältet
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

/**
 * TextField
 * En textinput med label och standardiserad styling.
 */
export function TextField({
  id,
  label,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  value,
  onChange,
  ...rest
}: Props) {
  return (
    <div className="mb-4">
      {/* Label kopplad till inputfältet */}
      <label
        className="block text-sm font-medium text-gray-800 mb-1"
        htmlFor={id}
      >
        {label}
      </label>

      {/* Själva inputfältet */}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        {...rest}
        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
      />
    </div>
  );
}