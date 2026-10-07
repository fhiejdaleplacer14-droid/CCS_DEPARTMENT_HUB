const TONES = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-navy-200 bg-navy-50 text-navy-800',
};

export default function Alert({ tone = 'info', title, children, className = '' }) {
    return (
        <div className={`rounded-md border px-4 py-3 text-sm ${TONES[tone]} ${className}`} role="alert">
            {title && <p className="font-medium">{title}</p>}
            {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
        </div>
    );
}
