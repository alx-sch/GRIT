type HTML_content = string | number | boolean | null | undefined;

export function html(strings: TemplateStringsArray, ...values: HTML_content[]) {
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
