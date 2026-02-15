import axios from 'axios';
import { useStore } from '../store/useStore';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const { user, token } = useStore.getState();

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (user?.id) {
        config.headers['x-user-id'] = user.id;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
