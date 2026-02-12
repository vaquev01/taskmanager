import axios from 'axios';
import { useStore } from '../store/useStore';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const user = useStore.getState().user;
    if (user?.id) {
        config.headers['x-user-id'] = user.id;
    }
    return config;
});

export default api;
