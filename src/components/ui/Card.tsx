import type { PropsWithChildren } from "react";

/** 
 * Card - en wrapper med vit bakgrund, rundade hörn och skugga.
 * Används för att centrera innehåll i ett kort.
 */
export function Card({ children }: PropsWithChildren) {
  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      {children}
    </div>
  );
}