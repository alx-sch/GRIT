import '../views/home-page.js';
import '../views/pong-page.js';
import '../views/pong3d-page.js';
import '../views/tictactoe-page.js';
import '../views/snake-page.js';
import { UsersPage } from '../views/users-page.js';

export function router(): void {
  const root = document.getElementById('app');

  if (!root) {
    console.error('Router error: #app not found');
    return;
  }

  root.innerHTML = ''; // clear previous view

  switch (location.pathname) {
    case '/':
    case '/home':
      root.innerHTML = '<home-page></home-page>';
      break;
    case '/tictactoe':
      root.innerHTML = '<tictactoe-page></tictactoe-page>';
      break;
    case '/users':
      root.append(UsersPage());
      break;
    case '/profile':
      root.innerHTML = "<main class='p-8'><h1>Profile</h1></main>";
      break;
    case '/pong':
      root.innerHTML = '<pong-page></pong-page>';
      break;
    case '/pong3d':
      root.innerHTML = '<pong3d-page></pong3d-page>';
      break;
    case '/snake':
      root.innerHTML = '<snake-page></snake-page>';
      break;
    default:
      root.textContent = '404';
  }
}

export function navigate(to: string): void {
  history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
