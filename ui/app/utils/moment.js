export function isStartOf(unit) {
  return this.clone().startOf(unit).isSame(this);
}
