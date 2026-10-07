import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import StatusBadge from './ui/StatusBadge';
import { relativeDate } from '../lib/format';

export default function ConcernCard({ concern, to, showAuthor = false }) {
    return (
        <Link
            to={to ?? `/concerns/${concern.id}`}
            className="surface surface-hover block p-5 hover:bg-slate-50/60"
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-semibold leading-snug text-slate-900">{concern.title}</h3>
                <StatusBadge status={concern.status} className="shrink-0" />
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{concern.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                <Badge>{concern.category}</Badge>
                {concern.location && <span>{concern.location}</span>}
                <span>Submitted {relativeDate(concern.created_at)}</span>
                {showAuthor && concern.submitted_by?.name && <span>by {concern.submitted_by.name}</span>}
            </div>
        </Link>
    );
}
