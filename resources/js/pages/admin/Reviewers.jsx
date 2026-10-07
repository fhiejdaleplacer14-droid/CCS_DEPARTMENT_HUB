import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { IconBook, IconSearch } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input, { Select } from '../../components/ui/Input';
import { SkeletonRows } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { fileSize, relativeDate } from '../../lib/format';

const STATUSES = ['APPROVED', 'FLAGGED', 'PENDING', 'REJECTED'];

export default function AdminReviewers() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('');
    const [subject, setSubject] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [page, setPage] = useState(1);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        api.get('/reviewers/filters')
            .then(({ data }) => setSubjects(data.subjects))
            .catch(() => {
            });
    }, []);

    useEffect(() => setPage(1), [debouncedSearch, status, subject]);

    const requestId = useRef(0);
    useEffect(() => {
        const id = ++requestId.current;

        setLoading(true);
        setError(null);

        const params = { page };

        if (debouncedSearch) params.search = debouncedSearch;
        if (status) params.status = status;
        if (subject) params.subject = subject;

        api.get('/admin/reviewers', { params })
            .then(({ data }) => {
                if (id === requestId.current) setResult(data);
            })
            .catch((err) => {
                if (id === requestId.current) setError(errorMessage(err, 'We could not load the library.'));
            })
            .finally(() => {
                if (id === requestId.current) setLoading(false);
            });
    }, [page, debouncedSearch, status, subject]);

    const counts = result?.meta_counts;

    return (
        <>
            <PageHeader title="Reviewer Library" description="Every upload and its screening outcome." />

            {counts && (
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {STATUSES.map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setStatus(status === value ? '' : value)}
                            className={`surface px-5 py-4 text-left transition-colors ${
                                status === value ? 'border-navy-300 bg-navy-50/60' : 'hover:bg-slate-50'
                            }`}
                        >
                            <p className="text-sm text-slate-500">{value}</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                                {counts[value] ?? 0}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            <div className="surface mb-6 p-4">
                <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by title, description or subject..."
                        className="pl-9"
                        aria-label="Search reviewers"
                    />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
                        <option value="">All statuses</option>
                        {STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </Select>

                    <Select value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Filter by subject">
                        <option value="">All subjects</option>
                        {subjects.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            {error && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading && !result ? (
                <SkeletonRows count={8} />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconBook className="h-8 w-8" />}
                        title="No reviewers found."
                        description="Try a different search term or clear the filters."
                        action={
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setStatus('');
                                    setSubject('');
                                }}
                            >
                                Clear filters
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <Card className={loading ? 'opacity-60 transition-opacity' : ''}>
                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3 font-medium">Title</th>
                                    <th className="px-5 py-3 font-medium">Subject</th>
                                    <th className="px-5 py-3 font-medium">Uploader</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 text-right font-medium">Downloads</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {result.data.map((reviewer) => (
                                    <tr key={reviewer.id} className="transition-colors hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <Link
                                                to={`/reviewers/${reviewer.id}`}
                                                className="font-medium text-slate-900 hover:text-navy-700"
                                            >
                                                {reviewer.title}
                                            </Link>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {relativeDate(reviewer.created_at)} &middot;{' '}
                                                {fileSize(reviewer.file_size)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {reviewer.subject}
                                            <p className="text-xs text-slate-400">{reviewer.year_level}</p>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{reviewer.uploader?.name}</td>
                                        <td className="px-5 py-3">
                                            <StatusBadge status={reviewer.status} />
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-600">
                                            {reviewer.download_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile list */}
                    <ul className="divide-y divide-slate-100 sm:hidden">
                        {result.data.map((reviewer) => (
                            <li key={reviewer.id}>
                                <Link
                                    to={`/reviewers/${reviewer.id}`}
                                    className="flex items-start justify-between gap-3 px-5 py-4"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {reviewer.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {reviewer.subject} &middot; {reviewer.uploader?.name}
                                        </p>
                                    </div>
                                    <StatusBadge status={reviewer.status} />
                                </Link>
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
