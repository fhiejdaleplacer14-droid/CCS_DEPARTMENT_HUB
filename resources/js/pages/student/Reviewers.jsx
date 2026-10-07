import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import PageHeader from '../../components/PageHeader';
import ReviewerCard from '../../components/ReviewerCard';
import { IconBook, IconSearch } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input, { Select } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import { SkeletonCardGrid } from '../../components/ui/Skeleton';

const SORTS = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'downloads', label: 'Most Downloaded' },
    { value: 'title', label: 'Title (A-Z)' },
];

export default function Reviewers() {
    const [searchParams, setSearchParams] = useSearchParams();
    const mine = searchParams.get('mine') === '1';

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({ subject: '', year_level: '', sort: 'newest' });
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => setPage(1), [debouncedSearch, filters, mine]);

    const { data: options } = useApi('/reviewers/filters');

    const { data: result, loading, refreshing, error } = useApi('/reviewers', {
        params: {
            page,
            sort: filters.sort,
            search: debouncedSearch || undefined,
            subject: filters.subject || undefined,
            year_level: filters.year_level || undefined,
            mine: mine ? 1 : undefined,
        },
        fallbackMessage: 'We could not load the reviewers.',
    });

    const updateFilter = (field) => (event) =>
        setFilters((current) => ({ ...current, [field]: event.target.value }));

    const clearAll = () => {
        setSearch('');
        setFilters({ subject: '', year_level: '', sort: 'newest' });
    };

    const hasQuery = Boolean(search || filters.subject || filters.year_level);

    const toggleMine = () => {
        const next = new URLSearchParams(searchParams);

        mine ? next.delete('mine') : next.set('mine', '1');
        setSearchParams(next, { replace: true });
    };

    return (
        <>
            <PageHeader
                title={mine ? 'My Uploads' : 'Reviewers'}
                description={
                    mine
                        ? 'Everything you have uploaded, including items still being screened.'
                        : 'Browse study material shared across the department.'
                }
                action={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={toggleMine}>
                            {mine ? 'Browse all' : 'My uploads'}
                        </Button>
                        <Button to="/reviewers/upload" size="sm">
                            Upload
                        </Button>
                    </div>
                }
            />

            <div className="surface mb-6 p-4">
                <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search reviewers..."
                        className="pl-9"
                        aria-label="Search reviewers"
                    />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Select value={filters.subject} onChange={updateFilter('subject')} aria-label="Filter by subject">
                        <option value="">All subjects</option>
                        {(options?.subjects ?? []).map((subject) => (
                            <option key={subject} value={subject}>
                                {subject}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={filters.year_level}
                        onChange={updateFilter('year_level')}
                        aria-label="Filter by year level"
                    >
                        <option value="">All year levels</option>
                        {(options?.year_levels ?? []).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </Select>

                    <Select value={filters.sort} onChange={updateFilter('sort')} aria-label="Sort reviewers">
                        {SORTS.map(({ value, label }) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </Select>
                </div>

                {hasQuery && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                            {result ? `${result.meta.total} result${result.meta.total === 1 ? '' : 's'}` : 'Searching...'}
                        </p>
                        <Button variant="ghost" size="sm" onClick={clearAll}>
                            Clear filters
                        </Button>
                    </div>
                )}
            </div>

            {error && !result && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading ? (
                <SkeletonCardGrid count={6} />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconBook className="h-8 w-8" />}
                        title="No reviewers found."
                        description={
                            hasQuery
                                ? 'Try a different search term or clear the filters.'
                                : mine
                                  ? 'You have not uploaded any reviewers yet.'
                                  : 'Nothing has been published yet. Be the first to share.'
                        }
                        action={
                            hasQuery ? (
                                <Button variant="secondary" size="sm" onClick={clearAll}>
                                    Clear filters
                                </Button>
                            ) : (
                                <Button to="/reviewers/upload" size="sm">
                                    Upload a reviewer
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <>
                    <div
                        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${refreshing ? 'opacity-70 transition-opacity' : ''}`}
                    >
                        {result.data.map((reviewer) => (
                            <ReviewerCard key={reviewer.id} reviewer={reviewer} showStatus={mine} />
                        ))}
                    </div>

                    <div className="surface mt-6">
                        <Pagination meta={result.meta} onChange={setPage} />
                    </div>
                </>
            )}
        </>
    );
}
