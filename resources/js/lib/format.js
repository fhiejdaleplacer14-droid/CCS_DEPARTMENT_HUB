export function relativeDate(iso) {
    if (!iso) return '';

    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

    if (seconds < 60) return 'just now';

    const MONTH = 2592000;

    if (seconds >= MONTH) return longDate(iso);

    const steps = [
        ['minute', 60],
        ['hour', 3600],
        ['day', 86400],
        ['week', 604800],
    ];

    let [unit, size] = steps[0];

    for (const [stepUnit, stepSize] of steps) {
        if (seconds >= stepSize) {
            [unit, size] = [stepUnit, stepSize];
        }
    }

    const value = Math.floor(seconds / size);

    return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

export function longDate(iso) {
    if (!iso) return '';

    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function dateTime(iso) {
    if (!iso) return '';

    return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function fileSize(bytes) {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function percent(value) {
    if (value === null || value === undefined) return '--';

    return `${Math.round(value * 100)}%`;
}
