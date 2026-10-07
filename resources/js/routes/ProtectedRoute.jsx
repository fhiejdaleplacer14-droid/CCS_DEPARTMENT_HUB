import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/api';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (isAuthenticated || (loading && getToken())) {
        return <Outlet />;
    }

    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
