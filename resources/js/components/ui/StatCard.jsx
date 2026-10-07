import { Link } from 'react-router-dom';

export default function StatCard({ label, value, to }) {
    const body = (
        <>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </>
    );

    if (to) {
        return (
            <Link to={to} className="surface surface-hover block px-5 py-4 hover:bg-slate-50">
                {body}
            </Link>
        );
    }

    return <div className="surface px-5 py-4">{body}</div>;
}
