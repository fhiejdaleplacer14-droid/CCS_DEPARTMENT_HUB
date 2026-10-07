import { useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { IconSearch, IconUsers } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input, { Select } from '../../components/ui/Input';
import { SkeletonRows } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import StatCard from '../../components/ui/StatCard';
import { longDate } from '../../lib/format';

export default function AdminUsers() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => setPage(1), [debouncedSearch, role]);

    const requestId = useRef(0);
    useEffect(() => {
        const id = ++requestId.current;

        setLoading(true);
        setError(null);

        const params = { page };

        if (debouncedSearch) params.search = debouncedSearch;
        if (role) params.role = role;

        api.get('/admin/users', { params })
            .then(({ data }) => {
                if (id === requestId.current) setResult(data);
            })
            .catch((err) => {
                if (id === requestId.current) setError(errorMessage(err, 'We could not load the users.'));
            })
            .finally(() => {
                if (id === requestId.current) setLoading(false);
            });
    }, [page, debouncedSearch, role]);

    return (
        <>
            <PageHeader title="Users" description="Everyone with a CCS Department Hub account." />

            {result?.meta_counts && (
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <StatCard label="Students" value={result.meta_counts.students} />
                    <StatCard label="Administrators" value={result.meta_counts.admins} />
                </div>
            )}

            <div className="surface mb-6 p-4">
                <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name or email..."
                        className="pl-9"
                        aria-label="Search users"
                    />
                </div>

                <Select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="mt-3"
                    aria-label="Filter by role"
                >
                    <option value="">All roles</option>
                    <option value="student">Students</option>
                    <option value="admin">Administrators</option>
                </Select>
            </div>

            {error && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading && !result ? (
                <SkeletonRows count={6} />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconUsers className="h-8 w-8" />}
                        title="No users found."
                        description="Try a different search term."
                        action={
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setRole('');
                                }}
                            >
                                Clear filters
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <Card className={loading ? 'opacity-60 transition-opacity' : ''}>
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">Role</th>
                                    <th className="px-5 py-3 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {result.data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                tone={user.role === 'admin' ? 'navy' : 'neutral'}
                                                className="capitalize"
                                            >
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{longDate(user.joined_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <ul className="divide-y divide-slate-100 sm:hidden">
                        {result.data.map((user) => (
                            <li key={user.id} className="flex items-start justify-between gap-3 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                                </div>
                                <Badge tone={user.role === 'admin' ? 'navy' : 'neutral'} className="capitalize">
                                    {user.role}
                                </Badge>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-slate-200">
                        <Pagination meta={result.meta} onChange={setPage} />
                    </div>
                </Card>
            )}
        </>
    );
}
