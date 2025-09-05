type Props = {
  className?: string;
};

/**
 * Divider - en tunn horisontell linje som delar upp innehåll.
 * Används t.ex. under knappar för visuell separation.
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