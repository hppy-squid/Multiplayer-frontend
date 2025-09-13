import type { PropsWithChildren } from "react";

/** 
 * Card - en wrapper med vit bakgrund, rundade hörn och skugga.
 * Används för att centrera innehåll i ett kort.
 */
export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (

    <div className={`bg-white rounded-2xl shadow-lg p-8 border border-gray-200 ${className}`}>

      {children}
    </div>
  );
}