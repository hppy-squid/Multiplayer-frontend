import { LobbyMembers } from "../components/ui/LobbyMembers";
import { QuizTime } from "../components/ui/QuizTime";
import { Questions } from "../components/ui/Questions";

/**
 * QuizPage - sidan som visar quiz-frågor.
 * Just nu bara en statisk layout utan funktionalitet.
    */
export function QuizPage() {
return (
    
  <div>
    {/* Wrapper: fyller hela höjden och centrerar kortet */}
    <div className="min-h-screen flex flex-row gap-8 -ml-32">

     {/* Vänster: LobbyMembers */}
  <div className="flex flex-col justify-start">
    <LobbyMembers />
  </div>

  {/* Höger: Quiz-innehåll + tidsräkning */}
  <div className="flex-1 flex flex-col -ml-26">

    {/* Topprad */}
    <div className="flex justify-between items-start mb-4">
      <div></div> {/* tom plats för vänster */}
      <h1 className="text-4xl font-bold tracking-wider text-gray-900 text-center flex-1">
        Quiz Game
      </h1>
      < QuizTime />
    </div>
    
      {/* Centrera Card + progressbar */}
    <div className="flex-1 flex flex-col justify-center items-center gap-6 w-full -ml-8">

        {/* Progresbar högst upp */}
    <div className="relative flex h-2 w-180 overflow-hidden rounded-full bg-gray-200">
      <div
        role="progressbar"
        aria-valuenow={15}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: "15%" }}
        className="flex h-full bg-blue-500"
        ></div>
    </div>
  
      {/* Kortet som håller allt innehåll */}
     < Questions />
      </div>
    </div>
    </div>
  </div>
);
}