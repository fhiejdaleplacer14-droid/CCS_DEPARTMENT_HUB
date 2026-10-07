import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';

export default function AdminRoute() {
    const { isAdmin, loading } = useAuth();

    if (loading) {
        return <Loading className="min-h-screen" />;
    }

    return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
