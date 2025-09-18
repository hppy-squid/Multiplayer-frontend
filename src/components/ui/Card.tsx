/******************************************************
 * UI-komponent: Card
 * Wrapper för att samla och centrera innehåll
 ******************************************************/

import type { PropsWithChildren } from "react";


export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (

    <div className={`bg-white rounded-2xl shadow-lg p-8 border border-gray-200 ${className}`}>

      {children}
    </div>
  );
}