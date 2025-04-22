import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import HomePage from './pages/HomePage';
import PollPage from './pages/PollPage';
import Navbar from '@/components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/poll/:shortCode" element={<PollPage />} />
            </Routes>
            <Toaster richColors position="bottom-center" />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;