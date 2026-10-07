import { dateTime } from '../lib/format';

const STEPS = ['SUBMITTED', 'UNDER REVIEW', 'IN PROGRESS', 'RESOLVED'];

export default function ConcernTimeline({ concern }) {
    const closed = concern.status === 'CLOSED';
    const currentIndex = closed ? STEPS.length - 1 : STEPS.indexOf(concern.status);

    return (
        <ol className="space-y-0">
            {STEPS.map((step, index) => {
                const done = index < currentIndex || (closed && index === STEPS.length - 1);
                const current = !closed && index === currentIndex;
                const isLast = index === STEPS.length - 1;

                return (
                    <li key={step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span
                                className={[
                                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                                    done
                                        ? 'border-navy-600 bg-navy-600'
                                        : current
                                          ? 'border-navy-600 bg-white'
                                          : 'border-slate-200 bg-white',
                                ].join(' ')}
                            >
                                {done && (
                                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                        <path
                                            d="M2.5 6.5L4.5 8.5L9.5 3.5"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                                {current && <span className="h-2 w-2 rounded-full bg-navy-600" />}
                            </span>

                            {!isLast && (
                                <span
                                    className={`my-1 w-0.5 flex-1 ${index < currentIndex ? 'bg-navy-600' : 'bg-slate-200'}`}
                                />
                            )}
                        </div>

                        <div className={isLast ? 'pb-0' : 'pb-6'}>
                            <p
                                className={`text-sm ${
                                    done || current ? 'font-medium text-slate-900' : 'text-slate-400'
                                }`}
                            >
                                {closed && isLast ? 'CLOSED' : step}
                            </p>
                            {index === 0 && (
                                <p className="mt-0.5 text-xs text-slate-400">{dateTime(concern.created_at)}</p>
                            )}
                            {isLast && concern.resolved_at && (
                                <p className="mt-0.5 text-xs text-slate-400">{dateTime(concern.resolved_at)}</p>
                            )}
                            {current && index > 0 && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Updated {dateTime(concern.updated_at)}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
