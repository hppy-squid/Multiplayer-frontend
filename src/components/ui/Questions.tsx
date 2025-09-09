import { Card } from "./Card";
import { Button } from "./Button";
import { Divider } from "./Divider";

export function Questions() {
  return (
    <Card>
   {/* Titel */}
           <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
             QUIZ FRÅGA
           </h1>
           {/* Formulär för svarsalternativ */}
           <div className="space-y-4">
             <Button type="button" className="w-full text-left">Alternativ 1</Button>
             <Button type="button" className="w-full text-left">Alternativ 2</Button>
             <Button type="button" className="w-full text-left">Alternativ 3</Button>
           </div>
           {/* Divider för att skilja mellan frågor och knappar */}
           <Divider className="my-6" />
           {/* Nästa fråga-knapp (inaktiv just nu) */}
           <Button type="button" disabled className="w-full">
               Nästa Fråga
           </Button>
            </Card>
    );
}