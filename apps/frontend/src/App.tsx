import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import Home from '@/pages/Home';
import Users from '@/pages/Users';
import Design from '@/pages/Design';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/design" element={<Design />} />
          <Route path="/users" element={<Users />} />
          <Route path="/profile" element={<div>Profile Page (Todo)</div>} />
        </Routes>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
