const base =
    'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500';

export default function Input({ invalid = false, className = '', ...props }) {
    return (
        <input
            className={`${base} ${invalid ? 'border-red-300' : 'border-slate-300'} ${className}`}
            {...props}
        />
    );
}

export function Textarea({ invalid = false, className = '', rows = 4, ...props }) {
    return (
        <textarea
            rows={rows}
            className={`${base} resize-y ${invalid ? 'border-red-300' : 'border-slate-300'} ${className}`}
            {...props}
        />
    );
}

export function Select({ invalid = false, className = '', children, ...props }) {
    return (
        <select
            className={`${base} ${invalid ? 'border-red-300' : 'border-slate-300'} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}
