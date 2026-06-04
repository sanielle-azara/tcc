import api from './axios';

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  findById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};
