const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../config/prisma');
const config = require('../../config/env');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../../utils/jwt');
const { sendPasswordResetEmail } = require('../../utils/email');

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });
  }
  if (user.status !== 'ACTIVE') {
    throw Object.assign(new Error('Usuário inativo'), { status: 403 });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshTokenValue = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Refresh token inválido'), { status: 401 });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revokedAt || new Date() > stored.expiresAt) {
    throw Object.assign(new Error('Refresh token inválido ou expirado'), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || user.status !== 'ACTIVE') {
    throw Object.assign(new Error('Usuário inativo'), { status: 403 });
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (token) => {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || user.status !== 'ACTIVE') return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + config.resetToken.expiresIn);

  await prisma.passwordReset.create({ data: { token, userId: user.id, expiresAt } });
  await sendPasswordResetEmail(email, token, user.name);
};

const resetPassword = async (token, newPassword) => {
  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.usedAt || new Date() > reset.expiresAt) {
    throw Object.assign(new Error('Token inválido ou expirado'), { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: reset.userId }, data: { revokedAt: new Date() } }),
  ]);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Senha atual incorreta'), { status: 400 });
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
};

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, changePassword };
