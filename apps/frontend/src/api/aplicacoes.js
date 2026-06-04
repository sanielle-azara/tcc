import api from './axios';

export const aplicacoesApi = {
  list: (params) => api.get('/aplicacoes', { params }),
  findById: (id) => api.get(`/aplicacoes/${id}`),
  create: (data) => api.post('/aplicacoes', data),
  saveAnswers: (id, data) => api.put(`/aplicacoes/${id}/answers`, data),
  finalize: (id, data) => api.post(`/aplicacoes/${id}/finalize`, data),
  remove: (id) => api.delete(`/aplicacoes/${id}`),
};
