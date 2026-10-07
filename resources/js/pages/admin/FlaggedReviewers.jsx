import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../lib/api';
import { invalidate } from '../../lib/store';
import PageHeader from '../../components/PageHeader';
import { IconShield, IconSparkle } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { fileSize, percent, relativeDate } from '../../lib/format';

export default function FlaggedReviewers() {
    const [result, setResult] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [flash, setFlash] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);

        return api
            .get('/admin/reviewers/flagged', { params: { page } })
            .then(({ data }) => setResult(data))
            .catch((err) => setError(errorMessage(err, 'We could not load the moderation queue.')))
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    const decide = async (reviewer, status) => {
        setBusyId(reviewer.id);
        setError(null);

        try {
            const { data } = await api.put(`/admin/reviewers/${reviewer.id}/status`, { status });

            invalidate('/reviewers', '/dashboard');
            setFlash(data.message);
            setResult((current) => ({
                ...current,
                data: current.data.filter((item) => item.id !== reviewer.id),
                meta: { ...current.meta, total: Math.max(0, current.meta.total - 1) },
            }));
        } catch (err) {
            setError(errorMessage(err, 'The decision could not be saved.'));
        } finally {
            setBusyId(null);
        }
    };

    const rescreen = async (reviewer) => {
        setBusyId(reviewer.id);
        setError(null);

        try {
            const { data } = await api.post(`/admin/reviewers/${reviewer.id}/rescreen`);

            setFlash(data.message);
            await load();
        } catch (err) {
            setError(errorMessage(err, 'Screening could not be re-run.'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <PageHeader
                title="Flagged Reviewers"
                description="Uploads that need a manual decision before they are published."
                action={
                    result?.meta_counts && (
                        <div className="flex gap-2 text-sm">
                            <Badge tone="warning">{result.meta_counts.FLAGGED} flagged</Badge>
                            <Badge>{result.meta_counts.PENDING} pending</Badge>
                        </div>
                    )
                }
            />

            {flash && (
                <Alert tone="success" className="mb-6">
                    {flash}
                </Alert>
            )}

            {error && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading && !result ? (
                <SkeletonList count={3} />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconShield className="h-8 w-8" />}
                        title="No flagged reviewers."
                        description="Everything has been screened and decided. Nothing needs your attention."
                        action={
                            <Button variant="secondary" size="sm" to="/admin/reviewers">
                                Browse the library
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <>
                    <div className="space-y-4">
                        {result.data.map((reviewer) => (
                            <Card key={reviewer.id} className="p-5">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                to={`/reviewers/${reviewer.id}`}
                                                className="text-[15px] font-semibold text-slate-900 hover:text-navy-700"
                                            >
                                                {reviewer.title}
                                            </Link>
                                            <StatusBadge status={reviewer.status} />
                                        </div>

                                        <p className="mt-1.5 text-xs text-slate-500">
                                            {reviewer.subject} &middot; {reviewer.year_level} &middot; uploaded by{' '}
                                            {reviewer.uploader?.name} &middot; {relativeDate(reviewer.created_at)}{' '}
                                            &middot; {fileSize(reviewer.file_size)}
                                        </p>

                                        {reviewer.description && (
                                            <p className="prose-measure mt-3 text-sm text-slate-600">
                                                {reviewer.description}
                                            </p>
                                        )}

                                        {/* AI result */}
                                        <div className="mt-4 rounded-md bg-slate-50 p-4">
                                            <div className="flex items-center gap-2">
                                                <IconSparkle className="h-4 w-4 text-navy-600" />
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    AI Result
                                                </p>
                                            </div>

                                            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                                <Item
                                                    label="Reviewer"
                                                    value={
                                                        reviewer.ai?.decision
                                                            ? reviewer.ai.decision === 'reject'
                                                              ? 'No'
                                                              : 'Yes'
                                                            : 'Unknown'
                                                    }
                                                />
                                                <Item label="Confidence" value={percent(reviewer.ai?.confidence)} />
                                                <Item
                                                    label="Subject"
                                                    value={reviewer.ai?.subject ?? '--'}
                                                />
                                                <Item
                                                    label="Quality"
                                                    value={
                                                        <span className="capitalize">
                                                            {reviewer.ai?.quality ?? '--'}
                                                        </span>
                                                    }
                                                />
                                            </dl>

                                            {reviewer.ai?.reason && (
                                                <div className="mt-3 border-t border-slate-200 pt-3">
                                                    <p className="text-xs font-medium text-slate-500">Reason</p>
                                                    <p className="prose-measure mt-1 text-sm text-slate-600">
                                                        {reviewer.ai.reason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2 lg:w-40 lg:flex-col">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            loading={busyId === reviewer.id}
                                            onClick={() => decide(reviewer, 'APPROVED')}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            disabled={busyId === reviewer.id}
                                            onClick={() => decide(reviewer, 'REJECTED')}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            to={`/reviewers/${reviewer.id}`}
                                        >
                                            View file
                                        </Button>
                                        {/* Useful when screening was unavailable at upload time. */}
                                        {!reviewer.ai?.decision && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={busyId === reviewer.id}
                                                onClick={() => rescreen(reviewer)}
                                            >
                                                Re-run AI
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
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

function Item({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
        </div>
    );
}
