import { Link } from 'react-router-dom';
import { IconArrowLeft } from './icons';

export default function PageHeader({ title, description, action, backTo, backLabel = 'Back' }) {
    return (
        <div className="mb-6">
            {backTo && (
                <Link
                    to={backTo}
                    className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
                >
                    <IconArrowLeft className="h-4 w-4" />
                    {backLabel}
                </Link>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
                    {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </div>
    );
}
