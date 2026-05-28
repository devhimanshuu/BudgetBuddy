import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIVibe } from '../use-uivibe';

describe('useUIVibe', () => {
  beforeEach(() => {
    localStorage.clear();
    const { result } = renderHook(() => useUIVibe());
    act(() => {
      result.current.setCompactMode(false);
      result.current.setIconSet('emoji');
    });
  });

  it('should have default values', () => {
    const { result } = renderHook(() => useUIVibe());
    expect(result.current.compactMode).toBe(false);
    expect(result.current.iconSet).toBe('emoji');
  });

  it('should update compactMode', () => {
    const { result } = renderHook(() => useUIVibe());
    act(() => {
      result.current.setCompactMode(true);
    });
    expect(result.current.compactMode).toBe(true);
  });

  it('should update iconSet', () => {
    const { result } = renderHook(() => useUIVibe());
    act(() => {
      result.current.setIconSet('lucide');
    });
    expect(result.current.iconSet).toBe('lucide');
  });
});
