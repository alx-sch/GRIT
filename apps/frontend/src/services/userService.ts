// import api from '@/lib/api'; // Keep the import so it's ready for later
import type { User } from '@/types/user';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Alice (Mock)', email: 'alice@mock.com' },
          { id: 2, name: 'Bob (Mock)', email: 'bob@mock.com' },
          { id: 3, name: 'Charlie (Mock)', email: 'charlie@mock.com' },
          { id: 4, name: 'David (Mock)', email: 'david@mock.com' },
        ]);
      }, 1000); // Simulate 1 second network lag
    });

    /* TODO: real implementation looks like this sort of
    const response = await api.get<User[]>('/users/list');
    return response.data;
    */
  },
};
