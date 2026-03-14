import { Navigate, useLocation } from 'react-router-dom';

export default function AppRedirect({ user }) {
  const loc = useLocation();
  const role = user?.role || 'tourist';

  if (loc.pathname === '/app' || loc.pathname === '/app/') {
    if (role === 'admin') return <Navigate to="/app/overview" replace />;
    if (role === 'provider') return <Navigate to="/app/dashboard" replace />;
    return <Navigate to="/app/explore" replace />;
  }
  return null;
}
