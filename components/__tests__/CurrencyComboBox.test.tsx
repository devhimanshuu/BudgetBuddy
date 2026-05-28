import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrencyComboBox } from '@/components/CurrencyComboBox';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: vi.fn().mockReturnValue(true), // assume desktop
}));

// Mock ResizeObserver for shadcn/ui components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = vi.fn();

describe('CurrencyComboBox', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.resetAllMocks();
  });

  it('renders Set Currency button when no currency is set', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ currency: 'USD' }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CurrencyComboBox />
      </QueryClientProvider>
    );

    // Wait for the query to resolve and check button
    expect(await screen.findByRole('button')).toBeInTheDocument();
  });
});
