import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LocaleProvider } from './context/LocaleContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { supabase } from './supabase';

const useSupabaseAuth = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('georgiatours-user');
      return s ? JSON.parse(s) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    if (!useSupabaseAuth) return;
    const syncUser = async (authUser) => {
      if (!authUser?.email) {
        setUser(null);
        try { sessionStorage.removeItem('georgiatours-user'); } catch (_) {}
        return;
      }
      const { data } = await supabase.from('users').select('id,name,email,role,provider_type,avatar,color').eq('email', authUser.email).maybeSingle();
      const u = data
        ? { id: data.id, name: data.name, email: data.email, role: data.role, avatar: data.avatar, color: data.color, type: data.provider_type }
        : { id: authUser.id, name: authUser.email?.split('@')[0], email: authUser.email, role: 'tourist' };
      setUser(u);
      try { sessionStorage.setItem('georgiatours-user', JSON.stringify(u)); } catch (_) {}
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    try {
      sessionStorage.setItem('georgiatours-user', JSON.stringify(u));
    } catch (_) {}
  };

  const handleLogout = () => {
    if (useSupabaseAuth) supabase.auth.signOut();
    setUser(null);
    try {
      sessionStorage.removeItem('georgiatours-user');
    } catch (_) {}
  };

  return (
    <HelmetProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </HelmetProvider>
  );
}
