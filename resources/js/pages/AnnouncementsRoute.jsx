import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import PublicLayout from '../components/layout/PublicLayout';
import Loading from '../components/ui/Loading';
import Announcements from './student/Announcements';

export default function AnnouncementsRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loading className="min-h-screen" />;
    }

    if (isAuthenticated) {
        return (
            <AppLayout>
                <Announcements />
            </AppLayout>
        );
    }

    return (
        <PublicLayout>
            <Announcements standalone />
        </PublicLayout>
    );
}
