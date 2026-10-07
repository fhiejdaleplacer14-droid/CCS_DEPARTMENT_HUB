import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Logo from './Logo';

export default function PublicLayout({ children }) {
    const { isAuthenticated, isAdmin } = useAuth();
    const home = isAdmin ? '/admin' : '/dashboard';

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Logo />

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/announcements"
                            className="hidden rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:block"
                        >
                            Announcements
                        </Link>

                        {isAuthenticated ? (
                            <Button to={home} size="sm">
                                Go to dashboard
                            </Button>
                        ) : (
                            <>
                                <Button to="/login" variant="ghost" size="sm">
                                    Sign in
                                </Button>
                                <Button to="/register" size="sm">
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children ?? <Outlet />}
            </main>

            <footer className="border-t border-slate-200 bg-slate-50">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
                        <div className="max-w-xs">
                            <Logo />
                            <p className="mt-3 text-sm text-slate-500">
                                A central place for department reviewers, announcements and student concerns.
                            </p>
                        </div>

                        <nav className="flex gap-12 text-sm">
                            <div>
                                <p className="font-medium text-slate-900">Navigate</p>
                                <ul className="mt-3 space-y-2 text-slate-500">
                                    <li>
                                        <Link to="/" className="hover:text-slate-900">
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/announcements" className="hover:text-slate-900">
                                            Announcements
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Account</p>
                                <ul className="mt-3 space-y-2 text-slate-500">
                                    <li>
                                        <Link to="/login" className="hover:text-slate-900">
                                            Sign in
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/register" className="hover:text-slate-900">
                                            Register
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}
