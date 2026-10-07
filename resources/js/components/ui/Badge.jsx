const TONES = {
    neutral: 'bg-slate-100 text-slate-700',
    navy: 'bg-navy-50 text-navy-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
    return (
        <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
        >
            {children}
        </span>
    );
}
