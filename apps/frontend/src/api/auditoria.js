import api from './axios';

export const auditoriaApi = {
  list: (params) => api.get('/auditoria', { params }),
};
