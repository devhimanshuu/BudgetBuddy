import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkeletonWrapper from '@/components/SkeletonWrapper';

describe('SkeletonWrapper', () => {
  it('renders children when not loading', () => {
    render(
      <SkeletonWrapper isLoading={false}>
        <div>Actual Content</div>
      </SkeletonWrapper>
    );
    expect(screen.getByText('Actual Content')).toBeInTheDocument();
  });

  it('renders skeleton and hides children when loading', () => {
    const { container } = render(
      <SkeletonWrapper isLoading={true}>
        <div>Hidden Content</div>
      </SkeletonWrapper>
    );
    
    // The content is rendered but wrapped in opacity-0
    const hiddenElement = screen.getByText('Hidden Content');
    expect(hiddenElement).toBeInTheDocument();
    expect(hiddenElement.parentElement).toHaveClass('opacity-0');
    
    // Check if the skeleton wrapper has the w-full class by default
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('does not apply w-full when fullWidth is false', () => {
    const { container } = render(
      <SkeletonWrapper isLoading={true} fullWidth={false}>
        <div>Hidden Content</div>
      </SkeletonWrapper>
    );
    
    expect(container.firstChild).not.toHaveClass('w-full');
  });
});
