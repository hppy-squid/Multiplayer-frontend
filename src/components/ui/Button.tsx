/**
 * Filens syfte:
 *
 * Denna fil innehåller en återanvändbar knappkomponent (`Button`) med Tailwind-stilar.
 * - Bygger på vanliga `<button>`-egenskaper via Reacts `ButtonHTMLAttributes`.
 * - Lägger till standardutseende (färg, padding, rundade hörn, font mm).
 * - Har inbyggt stöd för `disabled` (automatisk gråning + blockerad hover/cursor).
 * - Tillåter extra `className` för att utöka/ändra stilar.
 */

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

// Props: ärver alla vanliga button-attribut
type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Button
 * En bas-komponent för knappar med konsekvent styling.
 */
export function Button({ className = "", children, ...rest }: PropsWithChildren<Props>) {
  return (
    <button
      className={
        "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}