import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../lib/api';
import { invalidate } from '../../lib/store';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { IconDocument, IconDownload } from '../../components/icons';
import AiAnalysisPanel from '../../components/AiAnalysisPanel';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import Skeleton, { SkeletonText } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { fileSize, longDate } from '../../lib/format';

export default function ReviewerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const [reviewer, setReviewer] = useState(null);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let active = true;

        setReviewer(null);
        setError(null);

        api.get(`/reviewers/${id}`)
            .then(({ data }) => {
                if (active) setReviewer(data.data);
            })
            .catch((err) => {
                if (active) setError(errorMessage(err, 'We could not load this reviewer.'));
            });

        return () => {
            active = false;
        };
    }, [id]);

    const handleDownload = async () => {
        setDownloading(true);
        setError(null);

        try {
            const response = await api.get(`/reviewers/${id}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');

            link.href = url;
            link.download = reviewer.file_name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setReviewer((current) => ({ ...current, download_count: current.download_count + 1 }));
        } catch (err) {
            setError(errorMessage(err, 'The download could not be started.'));
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);

        try {
            await api.delete(`/reviewers/${id}`);

            invalidate('/reviewers', '/dashboard');
            navigate(isAdmin ? '/admin/reviewers' : '/reviewers?mine=1', { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'The reviewer could not be deleted.'));
            setConfirmDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    if (error && !reviewer) {
        return (
            <>
                <PageHeader title="Reviewer" backTo="/reviewers" backLabel="Back to reviewers" />
                <Alert tone="error">{error}</Alert>
            </>
        );
    }

    if (!reviewer) {
        return (
            <>
                <Skeleton className="h-7 w-2/3" />
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="surface p-5">
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-32 rounded" />
                                <Skeleton className="h-5 w-20 rounded" />
                            </div>
                            <SkeletonText className="mt-5" lines={3} />
                        </div>
                        <div className="surface p-5">
                            <Skeleton className="h-4 w-40" />
                            <SkeletonText className="mt-4" lines={2} />
                        </div>
                    </div>
                    <div className="surface p-5">
                        <Skeleton className="h-4 w-16" />
                        <SkeletonText className="mt-4" lines={4} />
                    </div>
                </div>
            </>
        );
    }

    const isOwner = user?.id === reviewer.uploader?.id;
    const canDelete = isOwner || isAdmin;
    const downloadable = reviewer.status === 'APPROVED' || isAdmin;

    return (
        <>
            <PageHeader
                title={reviewer.title}
                backTo={isAdmin ? '/admin/reviewers' : '/reviewers'}
                backLabel={isAdmin ? 'Back to library' : 'Back to reviewers'}
                action={
                    downloadable && (
                        <Button onClick={handleDownload} loading={downloading}>
                            {!downloading && <IconDownload className="h-4 w-4" />}
                            {downloading ? 'Preparing...' : 'Download'}
                        </Button>
                    )
                }
            />

            {error && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {!downloadable && (
                <Alert tone="warning" className="mb-6" title="Not yet available for download">
                    This reviewer has not been published. It is {reviewer.status.toLowerCase()} after AI screening.
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="navy">{reviewer.subject}</Badge>
                            <Badge>{reviewer.year_level}</Badge>
                            {(isOwner || isAdmin) && <StatusBadge status={reviewer.status} />}
                        </div>

                        {reviewer.description && (
                            <div className="mt-4">
                                <h2 className="text-sm font-semibold text-slate-900">Description</h2>
                                <p className="prose-measure mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                                    {reviewer.description}
                                </p>
                            </div>
                        )}

                        {reviewer.topics?.length > 0 && (
                            <div className="mt-5">
                                <h2 className="text-sm font-semibold text-slate-900">Topics covered</h2>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {reviewer.topics.map((topic) => (
                                        <Badge key={topic}>{topic}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* The AI breakdown is returned only to the uploader and administrators. */}
                    {reviewer.ai && <AiAnalysisPanel ai={reviewer.ai} status={reviewer.status} />}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader title="File" />
                        <dl className="divide-y divide-slate-100 text-sm">
                            <div className="flex items-start gap-3 px-5 py-3">
                                <IconDocument className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-900">{reviewer.file_name}</p>
                                    <p className="text-slate-500">{fileSize(reviewer.file_size)}</p>
                                </div>
                            </div>
                            <Row label="Uploaded by" value={reviewer.uploader?.name ?? 'Unknown'} />
                            <Row label="Upload date" value={longDate(reviewer.created_at)} />
                            <Row label="Downloads" value={reviewer.download_count} />
                        </dl>
                    </Card>

                    {canDelete && (
                        <Card className="p-5">
                            <h2 className="text-sm font-semibold text-slate-900">Manage</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Deleting removes the file permanently.
                            </p>
                            <Button
                                variant="danger"
                                size="sm"
                                className="mt-3"
                                onClick={() => setConfirmDelete(true)}
                            >
                                Delete reviewer
                            </Button>
                        </Card>
                    )}
                </div>
            </div>

            <Modal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title="Delete this reviewer?"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-900">{reviewer.title}</span> and its file will be
                    removed permanently. This cannot be undone.
                </p>
            </Modal>
        </>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 px-5 py-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
        </div>
    );
}
