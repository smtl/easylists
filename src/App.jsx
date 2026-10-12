import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Launcher from "./Routes/Launcher";
import Notepad from "./Notepad";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Launcher />} />
        <Route path="/:notepadId" element={<Notepad />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
