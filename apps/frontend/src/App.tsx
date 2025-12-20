import { Routes, Route } from 'react-router-dom';
import { AppNavigation } from '@/components/AppNavigation';
import Home from './views/Home';
import Login from './views/Login';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavigation />

      <main className="container mx-auto py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<div>Profile Page (Todo)</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
