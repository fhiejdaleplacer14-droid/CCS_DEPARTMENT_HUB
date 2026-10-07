import { Link } from 'react-router-dom';
import Spinner from './Spinner';

const VARIANTS = {
    primary: 'bg-navy-700 text-white hover:bg-navy-800 disabled:bg-navy-300',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
    success: 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-300',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    to,
    href,
    loading = false,
    disabled = false,
    className = '',
    ...props
}) {
    const classes = [
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
    ].join(' ');

    if (to) {
        return (
            <Link to={to} className={classes} {...props}>
                {children}
            </Link>
        );
    }

    if (href) {
        return (
            <a href={href} className={classes} {...props}>
                {children}
            </a>
        );
    }

    return (
        <button className={classes} disabled={disabled || loading} {...props}>
            {loading && <Spinner className="h-4 w-4" />}
            {children}
        </button>
    );
}
