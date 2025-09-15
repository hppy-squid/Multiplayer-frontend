/**
 * Filens syfte:
 *
 * Denna fil innehåller en återanvändbar wrapper-komponent (`Card`) för layout.
 * - Ger vit bakgrund, rundade hörn, skugga och padding.
 * - Används för att samla och centrera innehåll i ett kortformat.
 * - Tillåter extra `className` för att justera stilen vid behov.
 */

import type { PropsWithChildren } from "react";

/**
 * Card
 * En container för innehåll med konsekvent kort-styling.
 */
export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (

    <div className={`bg-white rounded-2xl shadow-lg p-8 border border-gray-200 ${className}`}>

      {children}
    </div>
  );
}