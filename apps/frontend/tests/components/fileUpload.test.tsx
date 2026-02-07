import { FileUpload } from '@/components/ui/fileUpload';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('FileUpload Component', () => {
  const user = userEvent.setup();

  it('renders empty state with upload instructions', () => {
    render(<FileUpload onChange={vi.fn()} />);

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('calls onChange when file is selected', async () => {
    const handleChange = vi.fn();
    render(<FileUpload onChange={handleChange} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');

    if (!(input instanceof HTMLInputElement)) {
      throw new Error('File input not found');
    }

    await user.upload(input, file);

    expect(handleChange).toHaveBeenCalledWith(file);
  });

  it('shows preview when file is selected', async () => {
    render(<FileUpload onChange={vi.fn()} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');

    if (!(input instanceof HTMLInputElement)) {
      throw new Error('File input not found');
    }

    await user.upload(input, file);

    expect(screen.getByAltText('preview')).toBeInTheDocument();
  });

  it('shows existing image when value prop is provided', () => {
    render(
      <FileUpload onChange={vi.fn()} value="http://localhost:9000/event-images/existing.jpg" />
    );

    const img = screen.getByAltText('preview');
    expect(img).toHaveAttribute('src', 'http://localhost:9000/event-images/existing.jpg');
  });

  it('clears image when delete button is clicked', async () => {
    const handleChange = vi.fn();
    render(
      <FileUpload onChange={handleChange} value="http://localhost:9000/event-images/existing.jpg" />
    );

    const deleteButton = screen.getByRole('button');
    await user.click(deleteButton);

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('shows progress bar when uploading', () => {
    render(<FileUpload onChange={vi.fn()} value="http://localhost:9000/test.jpg" progress={50} />);

    // Progress bar should be visible
    expect(document.querySelector('[data-slot="progress"]')).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    render(<FileUpload onChange={vi.fn()} disabled />);

    const dropzone = document.querySelector('button');
    expect(dropzone).toBeDisabled();
  });

  it('calls onError with friendly message when file is too large', async () => {
    const handleError = vi.fn();
    render(<FileUpload onChange={vi.fn()} onError={handleError} />);

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');

    if (!(input instanceof HTMLInputElement)) {
      throw new Error('File input not found');
    }

    await user.upload(input, largeFile);

    expect(handleError).toHaveBeenCalledWith(expect.stringContaining('5MB'));
  });
});
