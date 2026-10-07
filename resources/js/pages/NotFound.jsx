import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Logo from '../components/layout/Logo';

export default function NotFound() {
    const { isAuthenticated, isAdmin } = useAuth();
    const home = isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
            <Logo />
            <p className="mt-10 text-sm font-medium text-navy-700">404</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
                The page you are looking for does not exist or may have been moved.
            </p>
            <Button to={home} className="mt-6">
                {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
            </Button>
        </div>
    );
}
