import { Card } from "./Card";
import { Button } from "./Button";
import { Divider } from "./Divider";
import { getQuestionAndOptions } from "../../api/QuestionsApi";
import { useEffect, useState } from "react";


function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}
export function Questions() {
  const [ids, setIds] = useState<number[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [question, setQuestion] = useState<any>(null);

    // Slumpa fram vilken fråga som visas
  useEffect(() => {
    const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
    setIds(shuffle(numbers));
  }, []);

 // Sätt första id
  useEffect(() => {
    if (ids.length > 0) {
      setCurrentId(ids[0]);
    }
  }, [ids]);

// Hämta fråga från backend
  useEffect(() => {
  if (currentId !== null) {
    getQuestionAndOptions(currentId).then((data: any[]) => {
        console.log("Backend svar:", data);

      
      setQuestion({
        text: data[0].question, // för alla svaralternativ upprepar samma fråga
        options: shuffle(data.map(d => d.option_text)) // slumpa svarsalternativ
      });
    });
  }
}, [currentId]);

   
    const nextQuestion = () => {
    setIds(prev => prev.slice(1)); 
    setCurrentId(ids[1] ?? null);  
  };

  return (
    <Card>

    
     
   {/* Titel */}
           <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 mb-6">
             {question.text}
           </h1>

           {/*svarsalternativ */}
           <ul className="space-y-4">
             {question.options.map((opt: string, index: number) => (
          <li key={index}>{opt}</li>
        ))}
           </ul>
           {/* Divider */}
           <Divider className="my-6" />

           {/* Nästa fråga-knapp */}
           <Button onClick={nextQuestion}  className="w-full">
               Nästa Fråga
           </Button>
        
            </Card>
    );
}