import Users, { usersLoader } from '@/pages/users/Page';
import { userService } from '@/services/userService';
import { friendService } from '@/services/friendService';
import { UserResponse } from '@/types/user';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('@/services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

vi.mock('@/services/friendService', () => ({
  friendService: {
    listFriends: vi.fn(),
    listOutgoingRequests: vi.fn(),
    listIncomingRequests: vi.fn(),
  },
}));

vi.mock('@/lib/image_utils', () => ({
  getAvatarImageUrl: (key: string | null | undefined) =>
    key ? `http://test-minio/${key}` : undefined,
  getEventImageUrl: () => 'placeholder.svg',
}));

const mockUsers: UserResponse['data'] = [
  {
    id: 1,
    name: 'Alice',
    avatarKey: null,
    bio: null,
    city: null,
    country: null,
    createdAt: new Date().toISOString(),
    isProfilePublic: true,
  },
  {
    id: 2,
    name: 'Bob',
    avatarKey: null,
    bio: null,
    city: null,
    country: null,
    createdAt: new Date().toISOString(),
    isProfilePublic: true,
  },
  {
    id: 3,
    name: 'Carol',
    avatarKey: null,
    bio: null,
    city: null,
    country: null,
    createdAt: new Date().toISOString(),
    isProfilePublic: true,
  },
];

const emptyFriendData = { data: [], pagination: { hasMore: false, nextCursor: null } };

describe('Users Page', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getUsers).mockResolvedValue({
      data: mockUsers,
      pagination: { hasMore: false, nextCursor: null },
    });
    vi.mocked(friendService.listFriends).mockResolvedValue(emptyFriendData);
    vi.mocked(friendService.listOutgoingRequests).mockResolvedValue(emptyFriendData);
    vi.mocked(friendService.listIncomingRequests).mockResolvedValue(emptyFriendData);
  });

  function renderUsersPage(initialUrl = '/users') {
    const router = createMemoryRouter([{ path: '/users', Component: Users, loader: usersLoader }], {
      initialEntries: [initialUrl],
    });
    return { router, ...render(<RouterProvider router={router} />) };
  }

  describe('Basic Rendering', () => {
    it('renders all users when no search param', async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Carol')).toBeInTheDocument();
    });
  });

  describe('Search from URL', () => {
    it('pre-populates search input from ?search= on initial load', async () => {
      renderUsersPage('/users?search=alice');

      const searchInput = await screen.findByPlaceholderText('Search users...');
      expect(searchInput).toHaveValue('alice');
    });

    it('filters displayed users based on ?search= on initial load', async () => {
      renderUsersPage('/users?search=alice');

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      expect(screen.queryByText('Carol')).not.toBeInTheDocument();
    });

    it('syncs search input when URL search param changes via SPA navigation', async () => {
      const { router } = renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      expect(searchInput).toHaveValue('');

      await router.navigate('/users?search=carol');

      await waitFor(() => {
        expect(searchInput).toHaveValue('carol');
      });
    });

    it('filters displayed users after SPA navigation with ?search=', async () => {
      const { router } = renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      await router.navigate('/users?search=carol');

      await waitFor(() => {
        expect(screen.getByText('Carol')).toBeInTheDocument();
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      });
    });
  });

  describe('Local search', () => {
    it('filters users as user types in search box', async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      await user.type(searchInput, 'ali');

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        expect(screen.queryByText('Carol')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when search matches no users', async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      await user.type(searchInput, 'zzznobody');

      await waitFor(() => {
        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
      });
    });
  });
});
