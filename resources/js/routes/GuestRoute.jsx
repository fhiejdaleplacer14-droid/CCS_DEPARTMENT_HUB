import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';

export default function GuestRoute() {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return <Loading className="min-h-screen" />;
    }

    return isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <Outlet />;
}
