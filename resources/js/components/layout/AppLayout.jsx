import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    IconBook,
    IconChat,
    IconClose,
    IconDashboard,
    IconFlag,
    IconLogout,
    IconMegaphone,
    IconMenu,
    IconUpload,
    IconUser,
    IconUsers,
} from '../icons';
import Logo from './Logo';
import Skeleton from '../ui/Skeleton';

const STUDENT_NAV = [
    { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
    { to: '/reviewers', label: 'Reviewers', Icon: IconBook },
    { to: '/reviewers/upload', label: 'Upload Reviewer', Icon: IconUpload },
    { to: '/concerns', label: 'Concerns', Icon: IconChat },
    { to: '/announcements', label: 'Announcements', Icon: IconMegaphone },
    { to: '/profile', label: 'Profile', Icon: IconUser },
];

const ADMIN_NAV = [
    { to: '/admin', label: 'Dashboard', Icon: IconDashboard },
    { to: '/admin/reviewers', label: 'Reviewers', Icon: IconBook },
    { to: '/admin/reviewers/flagged', label: 'Flagged Reviewers', Icon: IconFlag },
    { to: '/admin/concerns', label: 'Concerns', Icon: IconChat },
    { to: '/admin/announcements', label: 'Announcements', Icon: IconMegaphone },
    { to: '/admin/users', label: 'Users', Icon: IconUsers },
];

function NavItems({ items, onNavigate }) {
    return (
        <nav className="space-y-0.5">
            {items.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/admin'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        [
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                            isActive
                                ? 'bg-navy-50 font-medium text-navy-800'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        ].join(' ')
                    }
                >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}

export default function AppLayout({ children }) {
    const { user, isAdmin, logout } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => setDrawerOpen(false), [pathname]);

    const items = isAdmin ? ADMIN_NAV : STUDENT_NAV;

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const sidebarBody = (
        <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <Logo to={isAdmin ? '/admin' : '/dashboard'} />
                <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="-mr-1 rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
                    aria-label="Close menu"
                >
                    <IconClose />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
                {isAdmin && (
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Administration
                    </p>
                )}
                <NavItems items={items} onNavigate={() => setDrawerOpen(false)} />
            </div>

            <div className="shrink-0 border-t border-slate-200 p-3">
                <div className="px-3 py-2">
                    {user ? (
                        <>
                            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </>
                    ) : (
                        <>
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="mt-1.5 h-3 w-40" />
                        </>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    <IconLogout className="h-4.5 w-4.5" />
                    Sign out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
                {sidebarBody}
            </aside>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => setDrawerOpen(false)}
                        aria-hidden="true"
                    />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white">
                        {sidebarBody}
                    </aside>
                </div>
            )}

            <div className="lg:pl-64">
                {/* Mobile top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100"
                        aria-label="Open menu"
                    >
                        <IconMenu />
                    </button>
                    <Logo to={isAdmin ? '/admin' : '/dashboard'} />
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    {children ?? <Outlet />}
                </main>
            </div>
        </div>
    );
}
