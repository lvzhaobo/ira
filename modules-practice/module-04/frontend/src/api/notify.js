import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const healthCheck = () => api.get('/notify/health');

export const getChannels = () => api.get('/notify/channels');
export const createChannel = (data) => api.post('/notify/channels', data);
export const deleteChannel = (channelId) => api.delete(`/notify/channels/${channelId}`);
export const testChannel = (type, data) => api.post(`/notify/channels/${type}/test`, data);

export const getTemplates = () => api.get('/notify/templates');
export const createTemplate = (data) => api.post('/notify/templates', data);
export const getTemplate = (id) => api.get(`/notify/templates/${id}`);
export const updateTemplate = (id, data) => api.patch(`/notify/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/notify/templates/${id}`);

export const getRules = (params = {}) => api.get('/notify/rules', { params });
export const createRule = (data) => api.post('/notify/rules', data);
export const getRule = (id) => api.get(`/notify/rules/${id}`);
export const updateRule = (id, data) => api.patch(`/notify/rules/${id}`, data);
export const deleteRule = (id) => api.delete(`/notify/rules/${id}`);

export const dispatch = (data) => api.post('/notify/dispatch', data);
export const getDeliveries = (params = {}) => api.get('/notify/deliveries', { params });

export default api;
