import { DatePicker } from '@/components/ui/datepicker';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { click } from '@testing-library/user-event/dist/cjs/convenience/click.js';
import { C } from 'node_modules/react-router/dist/development/index-react-server-client-P7VgYu6T.mjs';
import { vi } from 'vitest';
import { within } from '@testing-library/react';

describe('Date-Picker - Desktop', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query !== 'max-width: 768px',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders popover on desktop', async () => {
    const user = userEvent.setup();
    render(<DatePicker selected={undefined} onSelect={vi.fn()} />);
    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  it('displays selected date in button text', async () => {
    const selectedDate = {
      from: new Date('2026-01-15'),
      to: new Date('2026-01-20'),
    };

    render(<DatePicker selected={selectedDate} onSelect={vi.fn()} />);

    // Check formatted date appears in button
    expect(screen.getByText(/Jan 15.*Jan 20/i)).toBeInTheDocument();
  });
});

describe('Date-Picker - Mobile', () => {
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as any;
  });

  it('renders drawer on mobile', async () => {
    const user = userEvent.setup();
    render(<DatePicker selected={undefined} onSelect={vi.fn()} />);
    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays single date when only from is selected', async () => {
    const selectedDate = {
      from: new Date('2026-01-15'),
    };

    render(<DatePicker selected={selectedDate} onSelect={vi.fn()} />);

    // Check it shows "From Jan 15"
    expect(screen.getByText(/From Jan 15/i)).toBeInTheDocument();
  });

  it('Select button is disabled when no date selected', async () => {
    render(<DatePicker selected={undefined} onSelect={vi.fn()} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    const drawer = await screen.findByRole('dialog');
    expect(drawer).toBeInTheDocument();

    const selectButton = within(drawer).getByRole('button', { name: /select/i });
    expect(selectButton).toBeDisabled();
  });
});
