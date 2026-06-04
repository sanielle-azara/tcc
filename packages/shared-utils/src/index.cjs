'use strict';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-BR');
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const buildPaginatedResponse = (data, total, page, limit) => ({
  success: true,
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

const buildSuccessResponse = (data, message) => ({
  success: true,
  data,
  ...(message && { message }),
});

const buildErrorResponse = (message, errors) => ({
  success: false,
  message,
  ...(errors && { errors }),
});

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  const maskedUser = user.substring(0, 2) + '***';
  return `${maskedUser}@${domain}`;
};

module.exports = {
  formatDate,
  formatDateTime,
  calculateAge,
  buildPaginatedResponse,
  buildSuccessResponse,
  buildErrorResponse,
  parsePagination,
  maskEmail,
};
