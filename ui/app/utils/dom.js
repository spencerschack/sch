export function rect() {
  return this.getBoundingClientRect();
}

export function on(...events) {
  const callback = events.pop();
  events.forEach(event => {
    this.addEventListener(event, callback);
  });
}

export function off(...events) {
  const callback = events.pop();
  events.forEach(event => {
    this.removeEventListener(event, callback);
  });
}
