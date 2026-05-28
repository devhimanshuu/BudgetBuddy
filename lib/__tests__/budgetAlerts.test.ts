import { describe, it, expect } from 'vitest';
import { checkBudgetStatus, getBudgetAlerts, getAlertColor } from '../budgetAlerts';

describe('budgetAlerts', () => {
  describe('checkBudgetStatus', () => {
    it('should return none when spending is well below budget', () => {
      const result = checkBudgetStatus('Food', '🍔', 1000, 500, new Date('2024-01-15'));
      expect(result.level).toBe('none');
      expect(result.percentage).toBe(50);
    });

    it('should return warning when spending is near limit (80%+)', () => {
      const result = checkBudgetStatus('Food', '🍔', 1000, 850, new Date('2024-01-15'));
      expect(result.level).toBe('warning');
      expect(result.message).toContain('85%');
    });

    it('should return danger when spending exceeds budget', () => {
      const result = checkBudgetStatus('Food', '🍔', 1000, 1100, new Date('2024-01-15'));
      expect(result.level).toBe('danger');
      expect(result.message).toContain('exceeded');
    });
  });

  describe('getBudgetAlerts', () => {
    it('should filter out safe budgets and sort by severity', () => {
      const budgets = [
        { category: 'Food', categoryIcon: '🍔', amount: 1000 },
        { category: 'Transport', categoryIcon: '🚗', amount: 500 },
        { category: 'Entertainment', categoryIcon: '🎮', amount: 200 }
      ];
      
      const spending = {
        'Food': 500, // Safe (50%)
        'Transport': 450, // Warning (90%)
        'Entertainment': 250 // Danger (125%)
      };

      const alerts = getBudgetAlerts(budgets, spending, new Date('2024-01-15'));
      
      expect(alerts).toHaveLength(2);
      expect(alerts[0].category).toBe('Entertainment'); // Danger first
      expect(alerts[1].category).toBe('Transport'); // Warning second
    });
  });

  describe('getAlertColor', () => {
    it('returns correct color based on level', () => {
      expect(getAlertColor('danger')).toBe('destructive');
      expect(getAlertColor('warning')).toBe('warning');
      expect(getAlertColor('none')).toBe('default');
    });
  });
});
