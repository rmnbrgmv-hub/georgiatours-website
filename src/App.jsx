import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LocaleProvider } from './context/LocaleContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Tour from './pages/Tour';
import Map from './pages/Map';
import Stories from './pages/Stories';
import Story from './pages/Story';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Bookings from './pages/Bookings';
import Provider from './pages/Provider';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('georgiatours-user');
      return s ? JSON.parse(s) : null;
    } catch (_) {
      return null;
    }
  });

  const handleLogin = (u) => {
    setUser(u);
    try {
      sessionStorage.setItem('georgiatours-user', JSON.stringify(u));
    } catch (_) {}
  };

  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem('georgiatours-user');
    } catch (_) {}
  };

  return (
    <HelmetProvider>
      <LocaleProvider>
        <BrowserRouter>
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/tour/:id" element={<Tour user={user} />} />
              <Route path="/map" element={<Map />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/stories/:slug" element={<Story />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/provider/:id" element={<Provider />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/bookings" element={<Bookings user={user} />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LocaleProvider>
    </HelmetProvider>
  );
}
