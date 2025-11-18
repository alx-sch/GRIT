import { Component } from "../core/Component.js";

export class HomePage extends Component {
  render(): string {
    return `
      <section class="p-8">
        <h1 class="text-2xl font-bold mb-4">Home</h1>
        <p class="text-gray-700">
          Welcome to your new single-page application. This is the home page.
          asdfasdfasdf
        </p>
      </section>
    `;
  }
}

customElements.define("home-page", HomePage);
