/******************************************************
 * UI-komponent: Divider
 * Horisontell linje för att separera innehåll
 ******************************************************/

type Props = {
  className?: string;
};

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