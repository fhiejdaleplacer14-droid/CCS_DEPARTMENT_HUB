import { longDate } from '../lib/format';

export default function AnnouncementCard({ announcement, compact = false, action = null }) {
    const paragraphs = (announcement.content ?? '').split('\n').filter((line) => line.trim() !== '');
    const visible = compact ? paragraphs.slice(0, 1) : paragraphs;

    return (
        <article className="surface p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">{announcement.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                        {longDate(announcement.created_at)}
                        {announcement.author && ` • ${announcement.author}`}
                    </p>
                </div>
                {action}
            </div>

            <div className={`prose-measure mt-3 space-y-2 text-sm text-slate-600 ${compact ? 'line-clamp-2' : ''}`}>
                {visible.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
        </article>
    );
}
