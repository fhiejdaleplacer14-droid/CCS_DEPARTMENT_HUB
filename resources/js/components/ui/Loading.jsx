import Spinner from './Spinner';

export default function Loading({ label = 'Loading...', className = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-500 ${className}`}>
            <Spinner className="h-6 w-6 text-navy-600" />
            <p className="text-sm">{label}</p>
        </div>
    );
}
