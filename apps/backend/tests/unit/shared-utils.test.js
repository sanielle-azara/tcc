import { describe, it, expect } from 'vitest';
import { parsePagination, buildSuccessResponse, buildPaginatedResponse, buildErrorResponse, calculateAge } from '@psicopedagogia/shared-utils';

describe('shared-utils', () => {
  describe('parsePagination', () => {
    it('defaults to page 1, limit 10', () => {
      const result = parsePagination({});
      expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it('calculates skip correctly', () => {
      const result = parsePagination({ page: '3', limit: '20' });
      expect(result).toEqual({ page: 3, limit: 20, skip: 40 });
    });

    it('caps limit at 100', () => {
      const result = parsePagination({ limit: '999' });
      expect(result.limit).toBe(100);
    });
  });

  describe('buildSuccessResponse', () => {
    it('returns success:true with data', () => {
      const res = buildSuccessResponse({ id: 1 }, 'OK');
      expect(res.success).toBe(true);
      expect(res.data.id).toBe(1);
      expect(res.message).toBe('OK');
    });
  });

  describe('buildErrorResponse', () => {
    it('returns success:false with message', () => {
      const res = buildErrorResponse('Error occurred');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Error occurred');
    });
  });

  describe('buildPaginatedResponse', () => {
    it('calculates totalPages correctly', () => {
      const res = buildPaginatedResponse([], 45, 2, 10);
      expect(res.meta.totalPages).toBe(5);
      expect(res.meta.page).toBe(2);
    });
  });

  describe('calculateAge', () => {
    it('calculates age correctly', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);
      expect(calculateAge(birthDate)).toBe(10);
    });
  });
});
