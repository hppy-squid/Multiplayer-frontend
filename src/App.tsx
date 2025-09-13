import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";

import { LobbyPage } from './pages/LobbyPage'
// import { WaitingRoomPage } from "./pages/WaitingRoomPage";
import { QuizPage } from "./pages/QuizPage";


function App() {
  return(
     <Routes>
      {/* "/" skickar vidare till /lobby */}
      <Route path="/" element={<Navigate to="/lobby" replace />} />

      {/* /lobby → sidan där man kan joina eller skapa en lobby */}
      <Route path="/lobby" element={<LobbyPage />} />
      
      {/* /lobby/:lobbyCode → väntsal för en specifik lobby */}



      {/* sidan där quizet sker */}
      <Route path="/quiz" element={<QuizPage />} />

      <Route path="/lobby/:code" element={<LobbyPage />} />

    </Routes>
  )
}

export default App;
