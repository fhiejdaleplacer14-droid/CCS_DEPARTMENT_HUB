import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import { SkeletonStats } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import { longDate } from '../../lib/format';

export default function Profile() {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        let active = true;

        api.get('/dashboard')
            .then(({ data }) => {
                if (active) setStats(data.stats);
            })
            .catch(() => {
                if (active) setStats({});
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            <PageHeader title="Profile" description="Your department account." />

            <div className="grid max-w-3xl gap-6">
                <Card>
                    <CardHeader title="Account details" />
                    <dl className="divide-y divide-slate-100 text-sm">
                        <Row label="Name" value={user?.name} />
                        <Row label="Email address" value={user?.email} />
                        <Row
                            label="Role"
                            value={
                                <Badge tone={isAdmin ? 'navy' : 'neutral'} className="capitalize">
                                    {user?.role}
                                </Badge>
                            }
                        />
                        <Row label="Member since" value={longDate(user?.joined_at)} />
                    </dl>
                </Card>

                {!isAdmin && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">Your activity</h2>
                        {stats === null ? (
                            <SkeletonStats count={2} className="grid-cols-2" />
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Reviewers uploaded" value={stats.my_uploads ?? 0} to="/reviewers?mine=1" />
                                <StatCard label="Concerns submitted" value={stats.my_concerns ?? 0} to="/concerns" />
                            </div>
                        )}
                    </div>
                )}

                <Card className="p-5">
                    <h2 className="text-sm font-semibold text-slate-900">Need a change?</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Contact the department office to update your name or email address on record.
                    </p>
                    <Button variant="secondary" size="sm" className="mt-3" to="/concerns/new">
                        Submit a request
                    </Button>
                </Card>
            </div>
        </>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
        </div>
    );
}
