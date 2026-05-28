import { describe, it, expect } from 'vitest';
import { DateToUTCDate, GetFormatterForCurrency, GetPrivacyMask } from '../helper';

describe('helper utilities', () => {
  describe('DateToUTCDate', () => {
    it('should convert local date to UTC date', () => {
      const date = new Date(2024, 0, 1, 10, 0, 0); 
      const utcDate = DateToUTCDate(date);
      expect(utcDate.toISOString()).toMatch(/^2024-01-01T10:00:00\.000Z$/);
    });
  });

  describe('GetFormatterForCurrency', () => {
    it('should return correct formatter for USD', () => {
      const formatter = GetFormatterForCurrency('USD');
      const formatted = formatter.format(100);
      expect(formatted).toContain('100');
      expect(formatted).toContain('$');
    });

    it('should return correct formatter for EUR', () => {
      const formatter = GetFormatterForCurrency('EUR');
      const formatted = formatter.format(100);
      expect(formatted).toContain('100');
      expect(formatted).toContain('€');
    });
  });

  describe('GetPrivacyMask', () => {
    it('should replace number with mask but keep currency symbol', () => {
      const formatter = GetFormatterForCurrency('USD');
      const mask = GetPrivacyMask(formatter, '***');
      expect(mask).toContain('***');
      expect(mask).toContain('$');
    });
  });
});
