import { useEffect, useState, useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useDebounce } from '@/hooks/useDebounce';

export default function Users() {
  const { users, loading, error, fetchUsers } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => user.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [users, debouncedSearch]);

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
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
          Error: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      <input
        type="text"
        placeholder="Search users..."
        className="mb-6 p-2 border rounded w-full max-w-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ul className="list-disc pl-5">
        {filteredUsers.map((user) => (
          <li key={user.id} className="mb-2">
            <span className="font-medium">{user.name}</span>
            {' – '}
            <span className="text-gray-500">{user.email}</span>
          </li>
        ))}
      </ul>

      {filteredUsers.length === 0 && <p className="text-gray-500">No users found.</p>}
    </main>
  );
}
