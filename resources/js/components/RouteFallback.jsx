import Skeleton, { SkeletonPageHeader, SkeletonStats } from './ui/Skeleton';

export default function RouteFallback() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <SkeletonPageHeader />
            <SkeletonStats />
            <div className="surface mt-8 p-5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-4 h-3.5 w-full" />
                <Skeleton className="mt-2 h-3.5 w-5/6" />
            </div>
        </div>
    );
}
