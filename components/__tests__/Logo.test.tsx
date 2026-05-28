import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo, { LogoMobile } from '@/components/Logo';

describe('Logo', () => {
  it('renders Budget Buddy text in Logo', () => {
    render(<Logo />);
    expect(screen.getByText('Budget Buddy')).toBeInTheDocument();
  });

  it('renders Budget Buddy text in LogoMobile', () => {
    render(<LogoMobile />);
    expect(screen.getByText('Budget Buddy')).toBeInTheDocument();
  });
});
