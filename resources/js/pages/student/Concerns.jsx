import { useEffect, useState } from 'react';
import useApi from '../../hooks/useApi';
import ConcernCard from '../../components/ConcernCard';
import PageHeader from '../../components/PageHeader';
import { IconChat } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import { SkeletonList } from '../../components/ui/Skeleton';

export default function Concerns() {
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => setPage(1), [status]);

    const { data: options } = useApi('/concerns/categories');
    const { data: result, loading, refreshing, error } = useApi('/concerns', {
        params: { page, status: status || undefined },
        fallbackMessage: 'We could not load your concerns.',
    });

    return (
        <>
            <PageHeader
                title="My Concerns"
                description="Track the concerns you have raised with the department."
                action={
                    <Button to="/concerns/new" size="sm">
                        Submit Concern
                    </Button>
                }
            />

            <div className="surface mb-6 p-4">
                <Select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label="Filter by status"
                >
                    <option value="">All statuses</option>
                    {(options?.statuses ?? []).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </Select>
            </div>

            {error && !result && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading ? (
                <SkeletonList count={3} />
            ) : !result ? null : result.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconChat className="h-8 w-8" />}
                        title="No concerns submitted yet."
                        description={
                            status
                                ? 'No concerns match this status.'
                                : 'Report an issue with a classroom, laboratory, schedule or department service.'
                        }
                        action={
                            status ? (
                                <Button variant="secondary" size="sm" onClick={() => setStatus('')}>
                                    Show all
                                </Button>
                            ) : (
                                <Button to="/concerns/new" size="sm">
                                    Submit a concern
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <>
                    <div className={`space-y-4 ${refreshing ? 'opacity-70 transition-opacity' : ''}`}>
                        {result.data.map((concern) => (
                            <ConcernCard key={concern.id} concern={concern} />
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
