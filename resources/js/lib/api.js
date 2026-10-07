import axios from 'axios';

const TOKEN_KEY = 'department-hub-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
    baseURL: '/api',
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearToken();
        }

        return Promise.reject(error);
    },
);

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (!error.response) {
        return 'We could not reach the server. Check your connection and try again.';
    }

    const { data } = error.response;
    const firstFieldError = data?.errors && Object.values(data.errors)[0]?.[0];

    return firstFieldError || data?.message || fallback;
}


export function fieldErrors(error) {
    const errors = error.response?.data?.errors ?? {};

    return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages[0]]));
}

export default api;
