import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearToken, getToken, setToken } from '../lib/api';
import { clearAll } from '../lib/store';

const AuthContext = createContext(null);

function userKey() {
    const id = getToken()?.split('|')[0];

    return id ? `department-hub-user.${id}` : null;
}

function readCachedUser() {
    try {
        const key = userKey();
        const raw = key ? localStorage.getItem(key) : null;

        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCachedUser(user) {
    try {
        const key = userKey();

        if (!key) return;

        if (user) {
            localStorage.setItem(key, JSON.stringify(user));
        } else {
            localStorage.removeItem(key);
        }

        for (const existing of Object.keys(localStorage)) {
            if (existing.startsWith('department-hub-user.') && existing !== key) {
                localStorage.removeItem(existing);
            }
        }
    } catch {
   
    }
}

export function AuthProvider({ children }) {
    const hasToken = Boolean(getToken());

    const [user, setUser] = useState(() => (hasToken ? readCachedUser() : null));
    // Only block the UI when there is a token but no cached user to show.
    const [loading, setLoading] = useState(() => hasToken && !readCachedUser());

    useEffect(() => {
        if (!getToken()) return;

        let active = true;

        api.get('/user')
            .then(({ data }) => {
                if (!active) return;

                setUser(data.user);
                writeCachedUser(data.user);
            })
            .catch((error) => {
                if (!active) return;

                if (error.response?.status === 401) {
                    writeCachedUser(null);
                    clearToken();
                    setUser(null);
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const authenticate = useCallback((data) => {
        setToken(data.token);
        setUser(data.user);
        writeCachedUser(data.user);
        clearAll();

        return data.user;
    }, []);

    const login = useCallback(
        async (credentials) => {
            const { data } = await api.post('/login', credentials);

            return authenticate(data);
        },
        [authenticate],
    );

    const register = useCallback(
        async (details) => {
            const { data } = await api.post('/register', details);

            return authenticate(data);
        },
        [authenticate],
    );

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch {

        }

        writeCachedUser(null);
        clearToken();
        clearAll();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            isAuthenticated: Boolean(user),
            isAdmin: user?.role === 'admin',
        }),
        [user, loading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider.');
    }

    return context;
}
