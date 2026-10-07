export default function Field({ label, htmlFor, error, hint, required = false, children, className = '' }) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
                {label}
                {required && <span className="ml-0.5 text-red-600">*</span>}
            </label>
            <div className="mt-1.5">{children}</div>
            {error ? (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            ) : (
                hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
            )}
        </div>
    );
}
