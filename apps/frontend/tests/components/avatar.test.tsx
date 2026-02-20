import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

describe('Avatar Component', () => {
  describe('Initials Generation', () => {
    it('generates initials from first and last name', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback name="John Doe" />
        </Avatar>
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('generates initials from single word name', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback name="John" />
        </Avatar>
      );

      expect(screen.getByText('JO')).toBeInTheDocument();
    });

    it('generates initials from email', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback name="john@example.com" />
        </Avatar>
      );

      expect(screen.getByText('JO')).toBeInTheDocument();
    });

    it('handles names with multiple spaces', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback name="Mary Jane Watson" />
        </Avatar>
      );

      expect(screen.getByText('MJ')).toBeInTheDocument();
    });

    it('handles empty name by showing placeholder', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback name="">??</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('??')).toBeInTheDocument();
    });

    it('allows manual children override', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback>XY</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('XY')).toBeInTheDocument();
    });

    it('uppercases initials', () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url.jpg" />
          <AvatarFallback name="alice bob" />
        </Avatar>
      );

      expect(screen.getByText('AB')).toBeInTheDocument();
    });
  });
});
