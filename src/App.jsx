import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LocaleProvider } from './context/LocaleContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './supabase';
import { mapUserRow, isProviderUser } from './hooks/useAppData';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Layout from './components/Layout';
import AppLayout from './components/AppLayout';
import AppRedirect from './components/AppRedirect';

import Explore from './pages/Explore';
import Map from './pages/Map';
import Requests from './pages/Requests';
import Bookings from './pages/Bookings';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Tour from './pages/Tour';
import Provider from './pages/Provider';

import ProviderDashboard from './pages/app/ProviderDashboard';
import ProviderTours from './pages/app/ProviderTours';
import ProviderJobs from './pages/app/ProviderJobs';
import RequestsSwitch from './components/RequestsSwitch';
import AdminOverview from './pages/app/AdminOverview';
import AdminBookings from './pages/app/AdminBookings';
import AdminBookingDetail from './pages/app/AdminBookingDetail';
import AdminRequests from './pages/app/AdminRequests';
import AdminProviders from './pages/app/AdminProviders';
import AdminProviderDetail from './pages/app/AdminProviderDetail';
import AdminTours from './pages/app/AdminTours';
import AdminApprovals from './pages/app/AdminApprovals';
import AdminMessages from './pages/app/AdminMessages';

function AppRedirectWithUser({ user }) {
  return <AppRedirect user={user} />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('tourbid-user');
      return s ? JSON.parse(s) : null;
    } catch (_) {
      return null;
    }
  });
  const userRef = useRef(null);
  userRef.current = user;
  const skipNextSyncForProviderRef = useRef(false);

  useEffect(() => {
    const syncUser = async (authUser) => {
      if (!authUser?.id) {
        setUser(null);
        skipNextSyncForProviderRef.current = false;
        try { sessionStorage.removeItem('tourbid-user'); } catch (_) {}
        return;
      }
      const current = userRef.current;
      if (skipNextSyncForProviderRef.current && current?.id === authUser.id && isProviderUser(current)) {
        skipNextSyncForProviderRef.current = false;
        try { sessionStorage.setItem('tourbid-user', JSON.stringify(current)); } catch (_) {}
        return;
      }
      const { data } = await supabase.from('users').select('id,name,email,role,provider_type,avatar,color,bio,rating,total_bookings,earnings,vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_plate,max_seats,profile_picture,gallery').eq('id', authUser.id).maybeSingle();
      const currentAfterFetch = userRef.current;
      const sameIdAndProvider = currentAfterFetch?.id === authUser.id && isProviderUser(currentAfterFetch);
      let u;
      if (data) {
        const mapped = mapUserRow(data);
        if (currentAfterFetch?.id === authUser.id && isProviderUser(currentAfterFetch) && !isProviderUser(mapped)) {
          u = currentAfterFetch;
        } else {
          u = mapped;
        }
      } else {
        u = sameIdAndProvider ? currentAfterFetch : { id: authUser.id, name: authUser.email?.split('@')[0], email: authUser.email, role: 'tourist', type: undefined };
      }
      u.type = u.provider_type ?? u.type;
      if (authUser.email === 'admin@tourbid.ge') u.role = 'admin';
      if (u.provider_type === 'guide' || u.provider_type === 'transfer' || u.type === 'guide' || u.type === 'transfer') u.role = 'provider';
      let final = (currentAfterFetch?.id === authUser.id && isProviderUser(currentAfterFetch) && !isProviderUser(u)) ? currentAfterFetch : u;
      const latest = userRef.current;
      if (latest?.id === authUser.id && isProviderUser(latest) && !isProviderUser(final)) final = latest;
      setUser(final);
      try { sessionStorage.setItem('tourbid-user', JSON.stringify(final)); } catch (_) {}
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
    userRef.current = u;
    if (isProviderUser(u)) skipNextSyncForProviderRef.current = true;
    setUser(u);
    try { sessionStorage.setItem('tourbid-user', JSON.stringify(u)); } catch (_) {}
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    setUser(null);
    try { sessionStorage.removeItem('tourbid-user'); } catch (_) {}
  };

  return (
    <HelmetProvider>
      <ThemeProvider>
        <LocaleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/app" replace /> : <Landing />} />
              <Route path="/login" element={(user && !(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('driverVehiclePending'))) ? <Navigate to="/app" replace /> : <Login onLogin={handleLogin} />} />
              <Route path="/tour/:id" element={<Tour user={user} />} />
              <Route path="/provider/:id" element={<Provider />} />
              <Route path="/explore" element={user ? <Navigate to="/app/explore" replace /> : <Layout><Explore /></Layout>} />

              <Route path="/app" element={user ? <AppLayout user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
                <Route index element={<AppRedirectWithUser user={user} />} />
                <Route path="explore" element={<Explore />} />
                <Route path="map" element={<Map />} />
                <Route path="requests" element={<RequestsSwitch />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="chat" element={<Chat />} />
                <Route path="profile" element={<Profile />} />
                <Route path="tour/:id" element={<Tour />} />
                <Route path="dashboard" element={<ProviderDashboard />} />
                <Route path="tours" element={<ProviderTours />} />
                <Route path="jobs" element={<ProviderJobs />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="admin-bookings" element={<AdminBookings />} />
                <Route path="admin-booking/:id" element={<AdminBookingDetail />} />
                <Route path="admin-requests" element={<AdminRequests />} />
                <Route path="admin-providers" element={<AdminProviders />} />
                <Route path="admin-provider/:id" element={<AdminProviderDetail />} />
                <Route path="admin-tours" element={<AdminTours />} />
                <Route path="admin-approvals" element={<AdminApprovals />} />
                <Route path="messages" element={<AdminMessages />} />
              </Route>

              <Route path="*" element={<Navigate to={user ? '/app' : '/'} replace />} />
            </Routes>
          </BrowserRouter>
        </LocaleProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
