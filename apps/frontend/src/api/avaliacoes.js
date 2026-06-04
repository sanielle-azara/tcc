import api from './axios';

export const avaliacoesApi = {
  list: (params) => api.get('/avaliacoes', { params }),
  findById: (id) => api.get(`/avaliacoes/${id}`),
  create: (data) => api.post('/avaliacoes', data),
  update: (id, data) => api.put(`/avaliacoes/${id}`, data),
  remove: (id) => api.delete(`/avaliacoes/${id}`),
  getCategories: () => api.get('/avaliacoes/categories'),
};
