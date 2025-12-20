import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Login() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api-user/list')
      .then((res) => res.json())
      .then((data: User[]) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Conditional Rendering
  if (loading)
    return (
      <main className="p-8">
        <h1>Users</h1>
        <p>Loading...</p>
      </main>
    );
  if (error)
    return (
      <main className="p-8">
        <h1>Users</h1>
        <p>Failed to load users.</p>
      </main>
    );

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <ul className="list-disc pl-5">
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            {user.name} – <span className="text-gray-500">{user.email}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
