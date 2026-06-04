import api from './axios';

export const aprendentesApi = {
  list: (params) => api.get('/aprendentes', { params }),
  findById: (id) => api.get(`/aprendentes/${id}`),
  create: (data) => api.post('/aprendentes', data),
  update: (id, data) => api.put(`/aprendentes/${id}`, data),
  remove: (id) => api.delete(`/aprendentes/${id}`),
  listHistorico: (id) => api.get(`/aprendentes/${id}/historico`),
  addHistorico: (id, descricao) => api.post(`/aprendentes/${id}/historico`, { descricao }),
};
