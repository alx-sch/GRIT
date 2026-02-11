import LocationForm from '@/pages/create/event/components/LocationForm';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock services

vi.mock('@/services/locationService', () => ({
  locationService: {
    postLocation: vi.fn(),
  },
}));

describe('Location Form', () => {
  const user = userEvent.setup();

  // Mock created location response
  const mockCreatedLocation: LocationBase = {
    id: 1,
    name: 'Test Location',
    isPublic: true,
    authorId: 1,
    longitude: 52,
    latitude: 13,
    address: 'HarzerStrasse 42 Berlin',
    postalCode: '12345',
    city: 'Berlin',
    country: 'Germany',
    events: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(locationService.postLocation).mockResolvedValue(mockCreatedLocation);
  });

  function renderLocationForm() {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    return {
      onSuccess,
      onCancel,
      ...render(<LocationForm onSuccess={onSuccess} onCancel={onCancel} />),
    };
  }

  describe('Basic Rendering', () => {
    it('renders the name input', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name of the location/i })).toBeInTheDocument();
      });
    });

    it('renders the address input', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /address/i })).toBeInTheDocument();
      });
    });

    it('renders the postal code input', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /postal code/i })).toBeInTheDocument();
      });
    });

    it('renders the city input', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /city/i })).toBeInTheDocument();
      });
    });

    it('renders the country input', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /country/i })).toBeInTheDocument();
      });
    });

    it('renders the privacy toggle button', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /private/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /public/i })).toBeInTheDocument();
      });
    });

    it('renders the submit buttons', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });
    });
  });

  describe('Privacy Toggle', () => {
    it('defaults to private', async () => {
      renderLocationForm();

      await waitFor(() => {
        const privateButton = screen.getByRole('button', { name: /private/i });
        expect(privateButton).toHaveClass('bg-primary');
      });
    });

    it('toggles to public when clicked', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /public/i })).toBeInTheDocument();
      });

      const publicButton = screen.getByRole('button', { name: /public/i });
      await user.click(publicButton);

      await waitFor(() => {
        expect(publicButton).toHaveClass('bg-primary');
      });
    });

    it('toggles back to private when clicked', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /public/i })).toBeInTheDocument();
      });

      const publicButton = screen.getByRole('button', { name: /public/i });
      const privateButton = screen.getByRole('button', { name: /private/i });

      await user.click(publicButton);
      await user.click(privateButton);

      await waitFor(() => {
        expect(privateButton).toHaveClass('bg-primary');
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty on submit', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when name exceeds 64 characters', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name of the location/i }));
      });

      const nameInput = screen.getByRole('textbox', { name: /name of the location/i });
      const longName = 'a'.repeat(65);
      await user.type(nameInput, longName);

      const publishButton = screen.getByRole('button', { name: /submit/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be at most 64 characters long/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    async function fillValidForm() {
      const nameInput = screen.getByRole('textbox', { name: /name of the location/i });
      await user.type(nameInput, 'Test Location');

      const privateButton = screen.getByRole('button', { name: /private/i });
      await user.click(privateButton);
    }

    it('calls locationService.postLocation with correct payload', async () => {
      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name of the location/i })).toBeInTheDocument();
      });

      const nameInput = screen.getByRole('textbox', { name: /name of the location/i });
      const addressInput = screen.getByRole('textbox', { name: /address/i });
      const postalCodeInput = screen.getByRole('textbox', { name: /postal code/i });
      const cityInput = screen.getByRole('textbox', { name: /city/i });
      const countryInput = screen.getByRole('textbox', { name: /country/i });

      await user.type(nameInput, 'My Location');
      await user.type(addressInput, 'Finowstraße 43');
      await user.type(postalCodeInput, '12345');
      await user.type(cityInput, 'Berlin');
      await user.type(countryInput, 'Germany');

      const privateButton = screen.getByRole('button', { name: /private/i });
      await user.click(privateButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(locationService.postLocation).toHaveBeenCalledWith({
          name: 'My Location',
          address: 'Finowstraße 43',
          postalCode: '12345',
          city: 'Berlin',
          country: 'Germany',
          latitude: 52.45,
          longitude: 13.34,
          isPublic: false,
        });
      });
    });

    it('calls onSuccess callback with returned location on success', async () => {
      const { onSuccess } = renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name of the location/i })).toBeInTheDocument();
      });

      await fillValidForm();

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockCreatedLocation);
      });
    });
  });

  describe('Error Handling', () => {
    async function fillValidForm() {
      const nameInput = screen.getByRole('textbox', { name: /name of the location/i });
      await user.type(nameInput, 'Test Location');

      const privateButton = screen.getByRole('button', { name: /private/i });
      await user.click(privateButton);
    }

    it('displays API error message on submission failure', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { data: { message: 'Location name already exists' } },
      };
      vi.mocked(locationService.postLocation).mockRejectedValue(axiosError);

      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name of the location/i })).toBeInTheDocument();
      });

      await fillValidForm();

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/location name already exists/i)).toBeInTheDocument();
      });
    });

    it('displays generic error when API returns no message', async () => {
      vi.mocked(locationService.postLocation).mockRejectedValue(new Error('Network error'));

      renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name of the location/i })).toBeInTheDocument();
      });

      await fillValidForm();

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when Cancel button clicked', async () => {
      const { onCancel } = renderLocationForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
