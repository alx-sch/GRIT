export function html(strings: TemplateStringsArray, ...values: any[]) {
  return String.raw({ raw: strings }, ...values);
}

export class Component extends HTMLElement {
  render(): string {
    return '';
  }
  connectedCallback() {
    this.innerHTML = this.render();
  }
}
