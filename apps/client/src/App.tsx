import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import HomePage from './pages/HomePage';
import PollPage from './pages/PollPage';

function App() {
  return (
    <BrowserRouter>
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/poll/:shortCode" element={<PollPage />} />
        </Routes>
        <Toaster richColors position="bottom-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;