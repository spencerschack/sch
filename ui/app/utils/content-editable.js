export function blur(component, event) {
  component.element.blur();
  window.getSelection().removeAllRanges();
}
