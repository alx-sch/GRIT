import "../views/home-page.js";
import { UsersPage } from "../views/users-page.js";

export function router(): void {
  const root = document.getElementById("app");

  if (!root) {
    console.error("Router error: #app not found");
    return;
  }

  root.innerHTML = ""; // clear previous view

  switch (location.pathname) {
    case "/":
    case "/home":
      root.innerHTML = "<home-page></home-page>";
      break;
    case "/users":
      root.append(UsersPage());
      break;
    case "/profile":
      root.innerHTML = "<h1>Profile</h1>";
      break;
    default:
      root.textContent = "404";
  }
}

export function navigate(to: string): void {
  history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
