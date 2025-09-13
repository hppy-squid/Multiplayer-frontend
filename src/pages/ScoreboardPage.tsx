import { LobbyMembers } from "../components/ui/LobbyMembers"
import { Button } from "../components/ui/Button"

export function ScoreboardPage() {
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            {/* Titel */}
            <h1 className="text-8xl font-bold mb-24">Scoreboard</h1>

            {/* <Scoreboard/> */}
            <div >
            < LobbyMembers className="h-130 w-100 [&_h1]:text-4xl [&_h2]:text-lg [&_h3]:text-2xl [&_li]:text-xl"/>
            </div>
          <div className="mt-8 flex gap-4">
         <Button className="w-full max-w-xs">Spela igen</Button>
        <Button className="w-full max-w-xs">Tillbaka till lobbyn</Button>
        </div>
        </div>
    );
}