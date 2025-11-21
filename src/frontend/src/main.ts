import { router, navigate } from './controllers/router.js';

window.addEventListener('DOMContentLoaded', () => {
  router();

  document.body.addEventListener('click', (event) => {
    // Use closest to handle clicks on icons/text inside the link
    const target = (event.target as HTMLElement).closest('a');

    if (target && target.getAttribute('href')?.startsWith('/')) {
      event.preventDefault();
      const url = target.getAttribute('href')!;
      navigate(url);
    }
  });

  window.addEventListener('popstate', () => {
    router();
  });
});
