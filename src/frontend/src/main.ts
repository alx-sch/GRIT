import { router, navigate } from "./controllers/router.js";

window.addEventListener("DOMContentLoaded", () => {
  router();

  document.body.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.matches("a[href^='/']")) {
      event.preventDefault();
      const url = target.getAttribute("href")!;
      navigate(url);
    }
  });

  window.addEventListener("popstate", () => {
    router();
  });
});
