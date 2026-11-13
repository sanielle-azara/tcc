import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';

// O service é CommonJS: o Prisma vem do mock registrado em setup.js e o bcrypt
// é espionado no próprio objeto do módulo, que é o mesmo usado pelo service.
const nodeRequire = createRequire(import.meta.url);
const prisma = nodeRequire('../../src/config/prisma');
const bcrypt = nodeRequire('bcryptjs');
const { login } = nodeRequire('../../src/modules/auth/auth.service');

describe('AuthService', () => {
  let compareSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    compareSpy = vi.spyOn(bcrypt, 'compare');
  });

  afterEach(() => {
    compareSpy.mockRestore();
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
      compareSpy.mockResolvedValue(false);
      await expect(login('test@test.com', 'wrongpass')).rejects.toMatchObject({ status: 401 });
    });

    it('should return tokens on successful login', async () => {
      const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'PSICOPEDAGOGO', status: 'ACTIVE', passwordHash: 'hash' };
      prisma.user.findUnique.mockResolvedValue(user);
      compareSpy.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await login('test@test.com', 'password');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@test.com');
    });
  });
});
