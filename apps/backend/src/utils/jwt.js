const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ sub: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ sub: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

const getRefreshTokenExpiry = () => {
  const ms = parseDuration(config.jwt.refreshExpiresIn);
  return new Date(Date.now() + ms);
};

const parseDuration = (duration) => {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000;
  return parseInt(match[1]) * units[match[2]];
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry };
