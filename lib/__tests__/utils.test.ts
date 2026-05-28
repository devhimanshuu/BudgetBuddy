import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should resolve tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', true && 'class3')).toBe('class1 class3');
    });
  });
});
