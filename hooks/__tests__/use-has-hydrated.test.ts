import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useHasHydrated } from '../use-has-hydrated';

describe('useHasHydrated', () => {
  it('should return true after hydration (useEffect runs immediately in renderHook)', () => {
    const { result } = renderHook(() => useHasHydrated());
    expect(result.current).toBe(true);
  });
});
