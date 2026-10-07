export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
    return (
        <Tag className={`surface ${className}`} {...props}>
            {children}
        </Tag>
    );
}

export function CardHeader({ title, description, action, className = '' }) {
    return (
        <div className={`flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 ${className}`}>
            <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            {action}
        </div>
    );
}
