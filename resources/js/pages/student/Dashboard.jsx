import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import AnnouncementCard from '../../components/AnnouncementCard';
import ConcernCard from '../../components/ConcernCard';
import ReviewerCard from '../../components/ReviewerCard';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import Skeleton, { SkeletonCard, SkeletonListItem, SkeletonStats } from '../../components/ui/Skeleton';

export default function Dashboard() {
    const { user } = useAuth();
    const { data, loading, error } = useApi('/dashboard', {
        fallbackMessage: 'We could not load your dashboard.',
    });

    const firstName = user?.name?.split(' ')[0];

    return (
        <>
            <PageHeader
                title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
                description="Your reviewers, concerns and department notices at a glance."
                action={
                    <Button to="/reviewers/upload" size="sm">
                        Upload Reviewer
                    </Button>
                }
            />

            {error && !data && <Alert tone="error">{error}</Alert>}

            {loading ? (
                <SkeletonStats />
            ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Available Reviewers" value={data.stats.available_reviewers} to="/reviewers" />
                    <StatCard label="My Uploads" value={data.stats.my_uploads} to="/reviewers?mine=1" />
                    <StatCard label="My Concerns" value={data.stats.my_concerns} to="/concerns" />
                    <StatCard label="Announcements" value={data.stats.announcements} to="/announcements" />
                </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader
                            title="Recent Reviewers"
                            description="Newly published study material."
                            action={
                                <Button to="/reviewers" variant="ghost" size="sm">
                                    View all
                                </Button>
                            }
                        />
                        {loading ? (
                            <div className="grid gap-4 p-5 sm:grid-cols-2">
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        ) : data.recent_reviewers.length === 0 ? (
                            <EmptyState
                                title="No reviewers yet."
                                description="Be the first to share study material with your batch."
                                action={<Button to="/reviewers/upload" size="sm">Upload a reviewer</Button>}
                            />
                        ) : (
                            <div className="grid gap-4 p-5 sm:grid-cols-2">
                                {data.recent_reviewers.map((reviewer) => (
                                    <ReviewerCard key={reviewer.id} reviewer={reviewer} />
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="mt-6">
                        <CardHeader
                            title="My Concerns"
                            description="The concerns you have submitted."
                            action={
                                <Button to="/concerns" variant="ghost" size="sm">
                                    View all
                                </Button>
                            }
                        />
                        {loading ? (
                            <div className="space-y-4 p-5">
                                <SkeletonListItem />
                                <SkeletonListItem />
                            </div>
                        ) : data.my_concerns.length === 0 ? (
                            <EmptyState
                                title="No concerns submitted yet."
                                description="Let the department know about an issue with a room, laboratory or schedule."
                                action={<Button to="/concerns/new" size="sm">Submit a concern</Button>}
                            />
                        ) : (
                            <div className="space-y-4 p-5">
                                {data.my_concerns.map((concern) => (
                                    <ConcernCard key={concern.id} concern={concern} />
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
                                <Button to="/announcements" variant="ghost" size="sm">
                                    View all
                                </Button>
                            }
                        />
                        {loading ? (
                            <div className="space-y-5 p-5">
                                {[0, 1, 2].map((index) => (
                                    <div key={index}>
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="mt-2 h-3 w-1/3" />
                                        <Skeleton className="mt-3 h-3.5 w-full" />
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
