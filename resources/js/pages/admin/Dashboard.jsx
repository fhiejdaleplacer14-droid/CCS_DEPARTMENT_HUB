import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import AnnouncementCard from '../../components/AnnouncementCard';
import ConcernCard from '../../components/ConcernCard';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import Skeleton, { SkeletonListItem, SkeletonStats } from '../../components/ui/Skeleton';
import { relativeDate } from '../../lib/format';

export default function AdminDashboard() {
    const { data, loading, error } = useApi('/admin/dashboard', {
        fallbackMessage: 'We could not load the dashboard.',
    });

    return (
        <>
            <PageHeader
                title="Department Overview"
                description="Reviewer screening, student concerns and announcements."
                action={
                    <Button to="/admin/announcements" size="sm">
                        New Announcement
                    </Button>
                }
            />

            {error && !data && <Alert tone="error">{error}</Alert>}

            {loading ? (
                <SkeletonStats />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard label="Total Students" value={data.stats.total_students} to="/admin/users" />
                        <StatCard label="Published Reviewers" value={data.stats.total_reviewers} to="/admin/reviewers" />
                        <StatCard label="Needs Review" value={data.stats.needs_review} to="/admin/reviewers/flagged" />
                        <StatCard label="Open Concerns" value={data.stats.open_concerns} to="/admin/concerns" />
                    </div>

                    {data.stats.needs_review > 0 && (
                        <Alert tone="warning" className="mt-6">
                            {data.stats.needs_review} reviewer{data.stats.needs_review === 1 ? '' : 's'} need a
                            manual decision.{' '}
                            <Link to="/admin/reviewers/flagged" className="font-medium underline">
                                Open the queue
                            </Link>
                        </Alert>
                    )}
                </>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader
                            title="Recent Reviewer Uploads"
                            action={
                                <Button to="/admin/reviewers" variant="ghost" size="sm">
                                    View all
                                </Button>
                            }
                        />
                        {loading ? (
                            <div className="divide-y divide-slate-100">
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index} className="flex items-center justify-between gap-4 px-5 py-3.5">
                                        <div className="min-w-0 flex-1">
                                            <Skeleton className="h-3.5 w-1/2" />
                                            <Skeleton className="mt-2 h-3 w-1/3" />
                                        </div>
                                        <Skeleton className="h-5 w-20 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : data.recent_reviewers.length === 0 ? (
                            <EmptyState title="No reviewers uploaded yet." />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {data.recent_reviewers.map((reviewer) => (
                                    <li key={reviewer.id}>
                                        <Link
                                            to={`/reviewers/${reviewer.id}`}
                                            className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-900">
                                                    {reviewer.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                    {reviewer.subject} &middot; {reviewer.uploader?.name} &middot;{' '}
                                                    {relativeDate(reviewer.created_at)}
                                                </p>
                                            </div>
                                            <StatusBadge status={reviewer.status} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <CardHeader
                            title="Recent Concerns"
                            action={
                                <Button to="/admin/concerns" variant="ghost" size="sm">
                                    View all
                                </Button>
                            }
                        />
                        {loading ? (
                            <div className="space-y-4 p-5">
                                <SkeletonListItem />
                                <SkeletonListItem />
                            </div>
                        ) : data.recent_concerns.length === 0 ? (
                            <EmptyState title="No concerns submitted yet." />
                        ) : (
                            <div className="space-y-4 p-5">
                                {data.recent_concerns.map((concern) => (
                                    <ConcernCard
                                        key={concern.id}
                                        concern={concern}
                                        to={`/admin/concerns/${concern.id}`}
                                        showAuthor
                                    />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader
                            title="Recent Announcements"
                            action={
                                <Button to="/admin/announcements" variant="ghost" size="sm">
                                    Manage
                                </Button>
                            }
                        />
                        {loading ? (
                            <div className="space-y-5 p-5">
                                {[0, 1, 2].map((index) => (
                                    <div key={index}>
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="mt-2 h-3 w-1/3" />
                                    </div>
                                ))}
                            </div>
                        ) : data.recent_announcements.length === 0 ? (
                            <EmptyState title="No announcements available." />
                        ) : (
                            <div className="space-y-4 p-5">
                                {data.recent_announcements.map((announcement) => (
                                    <AnnouncementCard key={announcement.id} announcement={announcement} compact />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}
