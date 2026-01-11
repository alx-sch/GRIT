import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with default variant classes', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });

    expect(btn).toHaveClass('border-2 border-black');
    expect(btn).toHaveClass('bg-primary');
  });

  it('applies destructive variant correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole('button', { name: /delete/i });

    expect(btn).toHaveClass('bg-destructive');
  });

  it('renders as a different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/login">Login</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveClass('border-2 border-black');
  });

  it('prevents click when disabled', () => {
    const handleClick = vi.fn();

    render(
      <Button variant="disabled" disabled onClick={handleClick}>
        Dont Click me
      </Button>
    );

    const btn = screen.getByRole('button', { name: /dont click me/i });

    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
