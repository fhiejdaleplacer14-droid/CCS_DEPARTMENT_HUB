import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../lib/api';
import { isFresh, read, share, write } from '../lib/store';

export default function useApi(path, { params, enabled = true, fallbackMessage } = {}) {
    const key = buildKey(path, params);
    const cached = enabled ? read(key) : undefined;

    const [data, setData] = useState(cached?.data);
    const [loading, setLoading] = useState(enabled && !cached);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const latest = useRef(0);

    const load = useCallback(
        async ({ force = false } = {}) => {
            if (!enabled) return;

            const existing = read(key);

            if (!force && existing && isFresh(key)) {
                setData(existing.data);
                setLoading(false);

                return;
            }

            const id = ++latest.current;

            setError(null);
            existing ? setRefreshing(true) : setLoading(true);

            try {
                const response = await share(key, () => api.get(path, { params }));

                if (id !== latest.current) return;

                write(key, response.data);
                setData(response.data);
            } catch (err) {
                if (id !== latest.current) return;

                setError(errorMessage(err, fallbackMessage));
            } finally {
                if (id === latest.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
    
        [key, path, enabled], // eslint-disable-line react-hooks/exhaustive-deps
    );

    useEffect(() => {
        const existing = read(key);

        if (existing) {
            setData(existing.data);
            setLoading(false);
        } else {
            setData(undefined);
            setLoading(enabled);
        }

        load();
    }, [key, enabled, load]);

    return {
        data,
        loading,
        refreshing,
        error,
        refresh: () => load({ force: true }),
        setData,
    };
}

function buildKey(path, params) {
    if (!params) return path;

    const clean = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b));

    return clean.length ? `${path}?${new URLSearchParams(clean).toString()}` : path;
}
