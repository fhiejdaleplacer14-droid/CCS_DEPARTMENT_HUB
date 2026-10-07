import Button from './Button';

export default function Pagination({ meta, onChange }) {
    if (!meta || meta.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between gap-4 px-5 py-3">
            <p className="text-sm text-slate-500">
                Page {meta.current_page} of {meta.last_page}
                <span className="hidden sm:inline"> &middot; {meta.total} total</span>
            </p>
            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onChange(meta.current_page - 1)}
                    disabled={meta.current_page <= 1}
                >
                    Previous
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onChange(meta.current_page + 1)}
                    disabled={meta.current_page >= meta.last_page}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
