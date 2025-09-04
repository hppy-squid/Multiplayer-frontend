import type { InputHTMLAttributes } from "react";

type Props = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
};

/**
 * TextField - textinput med label.
 * Kan återanvändas för namn, kod osv.
 */
export function TextField({
  id,
  label,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
}: Props) {
  return (
    <div className="mb-4">
      <label
        className="block text-sm font-medium text-gray-800 mb-1"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
      />
    </div>
  );
}