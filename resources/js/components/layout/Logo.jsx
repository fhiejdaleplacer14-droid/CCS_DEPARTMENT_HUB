import { Link } from 'react-router-dom';

export default function Logo({ to = '/', className = '' }) {
    return (
        <Link
            to={to}
            className={`inline-flex items-center text-[15px] font-semibold tracking-tight text-slate-900 ${className}`}
        >
            CCS Department Hub
        </Link>
    );
}
