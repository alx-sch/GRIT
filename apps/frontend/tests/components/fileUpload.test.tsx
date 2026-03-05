import { FileUpload } from '@/components/ui/fileUpload';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('FileUpload Component', () => {
  const user = userEvent.setup();

  function getFileInput() {
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('File input not found');
    return input;
  }

  it('renders empty state with upload instructions', () => {
    render(<FileUpload onChange={vi.fn()} />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('calls onChange with a single-element array when file is selected', async () => {
    const handleChange = vi.fn();
    render(<FileUpload onChange={handleChange} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(getFileInput(), file);

    expect(handleChange).toHaveBeenCalledWith([file]);
  });

  it('shows preview when file is selected', async () => {
    render(<FileUpload onChange={vi.fn()} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(getFileInput(), file);

    expect(screen.getByAltText('preview')).toBeInTheDocument();
  });

  it('shows existing image when value prop is provided', () => {
    render(
      <FileUpload onChange={vi.fn()} value="http://localhost:9000/event-images/existing.jpg" />
    );

    const img = screen.getByAltText('preview');
    expect(img).toHaveAttribute('src', 'http://localhost:9000/event-images/existing.jpg');
  });

  it('calls onChange with empty array when delete button is clicked', async () => {
    const handleChange = vi.fn();
    render(
      <FileUpload onChange={handleChange} value="http://localhost:9000/event-images/existing.jpg" />
    );

    await user.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('shows progress bar when uploading', () => {
    render(<FileUpload onChange={vi.fn()} value="http://localhost:9000/test.jpg" progress={50} />);
    expect(document.querySelector('[data-slot="progress"]')).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    render(<FileUpload onChange={vi.fn()} disabled />);
    expect(document.querySelector('button')).toBeDisabled();
  });

  it('calls onError with friendly message when file is too large', async () => {
    const handleError = vi.fn();
    render(<FileUpload onChange={vi.fn()} onError={handleError} />);

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    await user.upload(getFileInput(), largeFile);

    expect(handleError).toHaveBeenCalledWith(expect.stringContaining('5MB'));
  });

  // --- Multiple files ---

  describe('multiple mode', () => {
    it('accumulates multiple files and calls onChange with all of them', async () => {
      const handleChange = vi.fn();
      render(<FileUpload onChange={handleChange} multiple />);

      const file1 = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
      const file2 = new File(['b'], 'doc.pdf', { type: 'application/pdf' });
      await user.upload(getFileInput(), [file1, file2]);

      expect(handleChange).toHaveBeenLastCalledWith([file1, file2]);
    });

    it('renders file names in the pending list', async () => {
      render(<FileUpload onChange={vi.fn()} multiple />);

      const file = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
      await user.upload(getFileInput(), file);

      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    it('removes a pending file when its remove button is clicked', async () => {
      const handleChange = vi.fn();
      render(<FileUpload onChange={handleChange} multiple />);

      const file1 = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
      const file2 = new File(['b'], 'doc.pdf', { type: 'application/pdf' });
      await user.upload(getFileInput(), [file1, file2]);

      // Click the remove button for the first file
      const removeButtons = screen.getAllByRole('button');
      await user.click(removeButtons[0]);

      expect(handleChange).toHaveBeenLastCalledWith([file2]);
      expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument();
    });

    it('renders existing files when existingFiles prop is provided', () => {
      const existingFiles = [
        { id: 1, fileName: 'uploaded.pdf', mimeType: 'application/pdf' },
        { id: 2, fileName: 'photo.png', mimeType: 'image/png' },
      ];
      render(<FileUpload onChange={vi.fn()} multiple existingFiles={existingFiles} />);

      expect(screen.getByText('uploaded.pdf')).toBeInTheDocument();
      expect(screen.getByText('photo.png')).toBeInTheDocument();
    });

    it('calls onRemoveExisting with the file id when removing an existing file', async () => {
      const handleRemove = vi.fn();
      const existingFiles = [{ id: 42, fileName: 'report.pdf', mimeType: 'application/pdf' }];
      render(
        <FileUpload
          onChange={vi.fn()}
          multiple
          existingFiles={existingFiles}
          onRemoveExisting={handleRemove}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(handleRemove).toHaveBeenCalledWith(42);
    });
  });
});
