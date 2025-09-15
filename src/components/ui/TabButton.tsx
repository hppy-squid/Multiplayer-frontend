/**
 * Filens syfte:
 *
 * Denna fil innehåller `TabButton`-komponenten.
 * - Används som en knapp i ett tabb-gränssnitt.
 * - Har stöd för en `active`-prop som markerar vilken tabb som är vald.
 * - Ger olika styling beroende på om tabben är aktiv eller inte.
 */

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

/**
 * TabButton
 * En knapp som fungerar som en tabb i UI:t.
 */
export function TabButton({ active = false, className = "", children, ...rest }: PropsWithChildren<Props>) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={
        `flex-1 py-2 rounded-full text-sm font-medium transition ` +
        (active
          ? "bg-white shadow border border-gray-200 text-gray-900 "
          : "text-gray-500 ") +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}