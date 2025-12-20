import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';

export default function Users() {
  const { users, loading, error, fetchUsers } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <p className="text-red-500">Failed to load users. Is the backend running?</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <ul className="list-disc pl-5">
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            <span className="font-medium">{user.name}</span>
            {' – '}
            <span className="text-gray-500">{user.email}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
