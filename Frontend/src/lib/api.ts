import axios from 'axios';
import { useStore } from '../store/useStore';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const { token } = useStore.getState();

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');
            const hasToken = !!useStore.getState().token;

            // Only force-logout if we had a token (session expired/invalid)
            // and it's not a login attempt with wrong credentials
            if (hasToken && !isAuthRoute) {
                useStore.getState().logout();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
