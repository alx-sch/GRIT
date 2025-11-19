export function UsersPage() {
  const root = document.createElement("div");
  root.innerHTML = "<main class='p-8'><h1>Users</h1><p>Loading...</p></main>";

  fetch("/api/users")
    .then((res) => res.json())
    .then((data: { id: number; name: string; email: string }[]) => {
      root.innerHTML = `
        <main class="p-8">
          <h1>Users</h1>
          <ul>
            ${data.map((el) => `<li>${el.name} – ${el.email}</li>`).join("")}
          </ul>
        </main>
      `;
    })
    .catch((err) => {
      root.innerHTML = "<p>Failed to load users.</p>";
      console.error(err);
    });

  return root;
}
