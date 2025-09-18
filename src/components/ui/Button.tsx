/******************************************************
 * UI-komponent: Button
 * Återanvändbar knapp med konsekvent styling
 ******************************************************/

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

// Props: ärver alla vanliga button-attribut
type Props = ButtonHTMLAttributes<HTMLButtonElement>;

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