import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import StatusBadge from './ui/StatusBadge';
import { relativeDate } from '../lib/format';

export default function ReviewerCard({ reviewer, showStatus = false }) {
    return (
        <Link
            to={`/reviewers/${reviewer.id}`}
            className="surface surface-hover flex h-full flex-col p-5 hover:bg-slate-50/60"
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-semibold leading-snug text-slate-900">{reviewer.title}</h3>
                {showStatus && <StatusBadge status={reviewer.status} className="shrink-0" />}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="navy">{reviewer.subject}</Badge>
                <Badge>{reviewer.year_level}</Badge>
            </div>

            {reviewer.topics?.length > 0 && (
                <p className="mt-3 text-sm text-slate-500">{reviewer.topics.slice(0, 3).join(' • ')}</p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-slate-400">
                <span>Uploaded {relativeDate(reviewer.created_at)}</span>
                {reviewer.download_count > 0 && (
                    <span>
                        {reviewer.download_count} download{reviewer.download_count === 1 ? '' : 's'}
                    </span>
                )}
            </div>
        </Link>
    );
}
