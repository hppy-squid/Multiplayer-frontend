
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Button - standardknapp med Tailwind-stilar.
 * Har inbyggt stöd för disabled.
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