import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { vi } from 'vitest';

describe('Button Component', () => {
  const user = userEvent.setup();

  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);

    const btn = screen.getByRole('button', { name: /click me/i });

    expect(btn).toBeInTheDocument();
    // Only check key variant indicators, not every single utility class
    expect(btn).toHaveClass('bg-primary');
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);

    const btn = screen.getByRole('button', { name: /delete/i });

    // We trust CVA works, we just verify the prop triggers the mapping
    expect(btn).toHaveClass('bg-destructive');
  });

  it('merges custom classes (className prop) correctly', () => {
    // This is CRITICAL for reusable UI components
    render(<Button className="mb-4 text-xs">Custom</Button>);

    const btn = screen.getByRole('button', { name: /custom/i });

    expect(btn).toHaveClass('mb-4');
    expect(btn).toHaveClass('text-xs');
    // Ensure default classes are NOT wiped out
    expect(btn).toHaveClass('inline-flex');
  });

  it('renders as a child element (Slot) correctly', () => {
    render(
      <Button asChild>
        <a href="/login">Login</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: /login/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
    // Verify it still looks like a button
    expect(link).toHaveClass('bg-primary');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    const btn = screen.getByRole('button', { name: /click/i });

    await user.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and prevents interactions', async () => {
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const btn = screen.getByRole('button', { name: /disabled/i });

    expect(btn).toBeDisabled();

    // Attempt to click using userEvent (mimics real user)
    // Note: userEvent.click usually throws on disabled elements or does nothing
    // ignoring the promise or catching checking logic is strictly safer:
    await user.click(btn).catch(() => {
      return;
    });

    expect(handleClick).not.toHaveBeenCalled();

    // Optional: Check if pointer-events-none is applied via your disabled variant
    expect(btn).toHaveClass('disabled:pointer-events-none');
  });
});
