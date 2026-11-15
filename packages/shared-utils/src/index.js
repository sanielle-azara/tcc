export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

// Datas sem horário (nascimento, data de aplicação) são gravadas como meia-noite UTC;
// formatá-las no fuso local (UTC-3) exibiria o dia anterior.
export const formatDateOnly = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-BR');
};

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getUTCDate())) {
    age--;
  }
  return age;
};

export const buildPaginatedResponse = (data, total, page, limit) => ({
  success: true,
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

export const buildSuccessResponse = (data, message) => ({
  success: true,
  data,
  ...(message && { message }),
});

export const buildErrorResponse = (message, errors) => ({
  success: false,
  message,
  ...(errors && { errors }),
});

export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  const maskedUser = user.substring(0, 2) + '***';
  return `${maskedUser}@${domain}`;
};
