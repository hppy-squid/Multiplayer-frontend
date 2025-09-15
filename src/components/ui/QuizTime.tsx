/**
 * Filens syfte:
 *
 * Denna fil innehåller `QuizTime`-komponenten.
 * - Visar en nedräkning eller tidsindikator för quizfrågor.
 * - Just nu hårdkodad till "15 sek".
 * - Kan byggas ut för att visa dynamisk tid från state eller props.
 */

export function QuizTime() {
  return (
    <div className="flex flex-col items-center justify-center">
        {/* Tidsindikator */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">15 sek</h2>
        </div>
  )
}

      