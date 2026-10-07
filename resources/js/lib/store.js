const entries = new Map();
const inflight = new Map();

const FRESH_MS = 30_000;

export function read(key) {
    return entries.get(key);
}

export function write(key, data) {
    entries.set(key, { data, at: Date.now() });
}

export function isFresh(key) {
    const entry = entries.get(key);

    return Boolean(entry) && Date.now() - entry.at < FRESH_MS;
}

export function share(key, request) {
    if (inflight.has(key)) {
        return inflight.get(key);
    }

    const promise = request().finally(() => inflight.delete(key));

    inflight.set(key, promise);

    return promise;
}

export function invalidate(...fragments) {
    for (const key of entries.keys()) {
        if (fragments.some((fragment) => key.includes(fragment))) {
            entries.delete(key);
        }
    }
}

export function clearAll() {
    entries.clear();
    inflight.clear();
}
