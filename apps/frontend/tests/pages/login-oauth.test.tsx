import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LoginPage, loginPageLoader } from '@/pages/login/Page';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { authService } from '@/services/authService';

vi.mock('@/services/authService', () => ({
  authService: {
    me: vi.fn(),
  },
}));

describe('Login OAuth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuthenticated();
    useCurrentUserStore.setState({ user: null });
  });

  it('handles OAuth token from URL and fetches user data', async () => {
    const mockUser = {
      id: 1,
      name: 'OAuth User',
      email: 'oauth@test.com',
      avatarKey: undefined,
    };

    vi.mocked(authService.me).mockResolvedValue(mockUser);

    const router = createMemoryRouter(
      [
        {
          path: '/login',
          element: <LoginPage />,
          loader: loginPageLoader,
        },
        {
          path: '/events',
          element: <div>Events Page</div>,
        },
      ],
      {
        initialEntries: ['/login?token=fake-jwt-token'],
      }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('fake-jwt-token');
    });

    await waitFor(() => {
      expect(authService.me).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(useCurrentUserStore.getState().user).toEqual(mockUser);
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/events');
    });
  });

  it('handles error when OAuth token fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(authService.me).mockRejectedValue(new Error('Invalid token'));

    const router = createMemoryRouter(
      [
        {
          path: '/login',
          element: <LoginPage />,
          loader: loginPageLoader,
        },
      ],
      {
        initialEntries: ['/login?token=invalid-token'],
      }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(authService.me).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('OAuth login failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('does not process OAuth if already logged in', async () => {
    useAuthStore.getState().setAuthenticated('existing-token');

    const mockUser = {
      id: 99,
      name: 'Existing User',
      email: 'existing@test.com',
      avatarKey: undefined,
    };

    vi.mocked(authService.me).mockResolvedValue(mockUser);

    const router = createMemoryRouter(
      [
        {
          path: '/login',
          element: <LoginPage />,
          loader: loginPageLoader,
        },
        {
          path: '/events',
          element: <div>Events Page</div>,
        },
      ],
      {
        initialEntries: ['/login?token=new-token'],
      }
    );

    render(<RouterProvider router={router} />);

    // Should still process the OAuth token and redirect
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/events');
    });

    // Should have called authService.me with the new token
    expect(authService.me).toHaveBeenCalled();
  });
});
