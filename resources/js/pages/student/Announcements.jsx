import { useState } from 'react';
import useApi from '../../hooks/useApi';
import AnnouncementCard from '../../components/AnnouncementCard';
import PageHeader from '../../components/PageHeader';
import { IconMegaphone } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Skeleton from '../../components/ui/Skeleton';

function SkeletonNotices({ count = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="surface p-5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-2 h-3 w-40" />
                    <Skeleton className="mt-4 h-3.5 w-full" />
                    <Skeleton className="mt-2 h-3.5 w-5/6" />
                </div>
            ))}
        </div>
    );
}

export default function Announcements({ standalone = false }) {
    const [page, setPage] = useState(1);
    const { data: result, loading, refreshing, error } = useApi('/announcements', {
        params: { page },
        fallbackMessage: 'We could not load the announcements.',
    });

    const body = (
        <>
            <PageHeader
                title="Announcements"
                description="Examination schedules, deadlines and department notices."
            />

            {error && !result && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading ? (
                <SkeletonNotices />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconMegaphone className="h-8 w-8" />}
                        title="No announcements available."
                        description="Department notices will appear here once they are published."
                    />
                </Card>
            ) : (
                <>
                    <div className={`space-y-4 ${refreshing ? 'opacity-70 transition-opacity' : ''}`}>
                        {result.data.map((announcement) => (
                            <AnnouncementCard key={announcement.id} announcement={announcement} />
                        ))}
                    </div>

                    <div className="surface mt-6">
                        <Pagination meta={result.meta} onChange={setPage} />
                    </div>
                </>
            )}
        </>
    );

    if (!standalone) {
        return body;
    }

    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">{body}</div>;
}
