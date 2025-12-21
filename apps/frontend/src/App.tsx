import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import Home from './pages/Home';
import Users from './pages/Users';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/profile" element={<div>Profile Page (Todo)</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
