export default function EmptyState({ title, description, action, icon = null, className = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
            {icon && <div className="mb-3 text-slate-300">{icon}</div>}
            <p className="text-sm font-medium text-slate-900">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
