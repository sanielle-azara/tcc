import api from './axios';

export const relatoriosApi = {
  list: (params) => api.get('/relatorios', { params }),
  findById: (id) => api.get(`/relatorios/${id}`),
  findByAplicacao: (aplicacaoId) => api.get(`/relatorios/aplicacao/${aplicacaoId}`),
  createOrUpdate: (data) => api.post('/relatorios', data),
};
