/**
 * Filens syfte:
 *
 * Denna fil innehåller en enkel layoutkomponent (`Divider`).
 * - Visar en tunn horisontell linje för att separera innehåll.
 * - Ger visuell paus mellan t.ex. knappar eller sektioner.
 * - Tillåter extra `className` för anpassad styling.
 */

type Props = {
  className?: string;
};

/**
 * Divider
 * En horisontell linje med gradient för att skapa separation i UI:t.
 */
export function Divider({ className = "" }: Props) {
  return (
    <div
      className={
        "h-1 w-40 bg-gradient-to-r from-transparent via-gray-200 to-transparent rounded-full mx-auto mt-6 " +
        className
      }
    />
  );
}