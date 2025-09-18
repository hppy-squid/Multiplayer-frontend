/******************************************************
 * UI-komponent: TabButton
 * En tabb-knapp med styling för aktiv/inaktiv status
 ******************************************************/

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };


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