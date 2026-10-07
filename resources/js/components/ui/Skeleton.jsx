export default function Skeleton({ className = '' }) {
    return <div className={`animate-pulse rounded bg-slate-200/80 ${className}`} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    className={`h-3.5 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

export function SkeletonStats({ count = 4, className = 'grid-cols-2 lg:grid-cols-4' }) {
    return (
        <div className={`grid gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="surface px-5 py-4">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="mt-2.5 h-7 w-12" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="surface flex h-full flex-col p-5">
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
            </div>
            <Skeleton className="mt-3 h-3.5 w-5/6" />
            <div className="mt-auto flex justify-between pt-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}

export function SkeletonCardGrid({ count = 6, className = 'sm:grid-cols-2 lg:grid-cols-3' }) {
    return (
        <div className={`grid gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}

export function SkeletonListItem() {
    return (
        <div className="surface p-5">
            <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-20 rounded" />
            </div>
            <Skeleton className="mt-3 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-4/5" />
            <div className="mt-3 flex gap-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-28" />
            </div>
        </div>
    );
}

export function SkeletonList({ count = 4 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonListItem key={index} />
            ))}
        </div>
    );
}

export function SkeletonRows({ count = 6 }) {
    return (
        <div className="surface divide-y divide-slate-100">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-3.5 w-1/3" />
                        <Skeleton className="mt-2 h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonPageHeader({ withAction = true }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <Skeleton className="h-7 w-56" />
                <Skeleton className="mt-2 h-3.5 w-72" />
            </div>
            {withAction && <Skeleton className="h-9 w-32 rounded-md" />}
        </div>
    );
}
