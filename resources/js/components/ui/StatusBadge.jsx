import Badge from './Badge';

const TONES = {
    // Reviewer screening
    PENDING: 'neutral',
    APPROVED: 'success',
    FLAGGED: 'warning',
    REJECTED: 'danger',

    // Concern workflow
    SUBMITTED: 'neutral',
    'UNDER REVIEW': 'navy',
    'IN PROGRESS': 'warning',
    RESOLVED: 'success',
    CLOSED: 'neutral',
};

export default function StatusBadge({ status, className = '' }) {
    if (!status) return null;

    return (
        <Badge tone={TONES[status] ?? 'neutral'} className={className}>
            {status}
        </Badge>
    );
}
