import { Navigate, useLocation } from 'react-router-dom';
import { isProviderUser } from '../hooks/useAppData';

export default function AppRedirect({ user }) {
  const loc = useLocation();
  const role = user?.role || 'tourist';
  const isProvider = isProviderUser(user);

  if (loc.pathname === '/app' || loc.pathname === '/app/') {
    if (role === 'admin') return <Navigate to="/app/overview" replace />;
    if (isProvider) return <Navigate to="/app/dashboard" replace />;
    return <Navigate to="/app/explore" replace />;
  }
  return null;
}
