export class Component extends HTMLElement {
  render(): string {
    return "";
  }
  connectedCallback() {
    this.innerHTML = this.render();
  }
}
