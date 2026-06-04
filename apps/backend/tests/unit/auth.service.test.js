import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import prisma from '../../src/config/prisma';
import bcrypt from 'bcryptjs';
import { login } from '../../src/modules/auth/auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should throw 401 for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(login('test@test.com', 'password')).rejects.toMatchObject({ status: 401 });
    });

    it('should throw 403 for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', status: 'INACTIVE', passwordHash: 'hash' });
      await expect(login('test@test.com', 'password')).rejects.toMatchObject({ status: 403 });
    });

    it('should throw 401 for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1', status: 'ACTIVE', email: 'test@test.com', passwordHash: 'hash',
      });
      bcrypt.compare.mockResolvedValue(false);
      await expect(login('test@test.com', 'wrongpass')).rejects.toMatchObject({ status: 401 });
    });

    it('should return tokens on successful login', async () => {
      const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'PSICOPEDAGOGO', status: 'ACTIVE', passwordHash: 'hash' };
      prisma.user.findUnique.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await login('test@test.com', 'password');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@test.com');
    });
  });
});
