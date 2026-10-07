import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import ConcernTimeline from '../../components/ConcernTimeline';
import { IconDocument } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import Skeleton, { SkeletonText } from '../../components/ui/Skeleton';
import StatusBadge from '../../components/ui/StatusBadge';
import { longDate } from '../../lib/format';

export default function ConcernDetails() {
    const { id } = useParams();
    const location = useLocation();
    const { isAdmin } = useAuth();

    const [concern, setConcern] = useState(null);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const flash = location.state?.flash;

    useEffect(() => {
        let active = true;

        setConcern(null);
        setError(null);

        api.get(`/concerns/${id}`)
            .then(({ data }) => {
                if (active) setConcern(data.data);
            })
            .catch((err) => {
                if (active) setError(errorMessage(err, 'We could not load this concern.'));
            });

        return () => {
            active = false;
        };
    }, [id]);

    const handleAttachment = async () => {
        setDownloading(true);

        try {
            const response = await api.get(`/concerns/${id}/attachment`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');

            link.href = url;
            link.download = concern.attachment_name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(errorMessage(err, 'The attachment could not be downloaded.'));
        } finally {
            setDownloading(false);
        }
    };

    const backTo = isAdmin ? '/admin/concerns' : '/concerns';

    if (error && !concern) {
        return (
            <>
                <PageHeader title="Concern" backTo={backTo} backLabel="Back to concerns" />
                <Alert tone="error">{error}</Alert>
            </>
        );
    }

    if (!concern) {
        return (
            <>
                <Skeleton className="h-7 w-1/2" />
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="surface p-5">
                            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index}>
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="mt-2 h-4 w-24" />
                                    </div>
                                ))}
                            </div>
                            <SkeletonText className="mt-6" lines={4} />
                        </div>
                    </div>
                    <div className="surface p-5">
                        <Skeleton className="h-4 w-20" />
                        <SkeletonText className="mt-4" lines={4} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader title={concern.title} backTo={backTo} backLabel="Back to concerns" />

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

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-5">
                        <dl className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">
                            <Item label="Category" value={concern.category} />
                            <Item label="Location" value={concern.location || 'Not specified'} />
                            <Item label="Status" value={<StatusBadge status={concern.status} />} />
                            <Item label="Submitted" value={longDate(concern.created_at)} />
                        </dl>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <h2 className="text-sm font-semibold text-slate-900">Description</h2>
                            <p className="prose-measure mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                                {concern.description}
                            </p>
                        </div>

                        {concern.has_attachment && (
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <h2 className="text-sm font-semibold text-slate-900">Attachment</h2>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <IconDocument className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm text-slate-600">{concern.attachment_name}</span>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleAttachment}
                                        loading={downloading}
                                    >
                                        Download
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {concern.admin_response && (
                        <Card>
                            <CardHeader title="Department response" />
                            <p className="prose-measure whitespace-pre-line px-5 py-4 text-sm leading-relaxed text-slate-600">
                                {concern.admin_response}
                            </p>
                        </Card>
                    )}
                </div>

                <div>
                    <Card>
                        <CardHeader title="Progress" />
                        <div className="px-5 py-5">
                            <ConcernTimeline concern={concern} />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

function Item({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 font-medium text-slate-900">{value}</dd>
        </div>
    );
}
