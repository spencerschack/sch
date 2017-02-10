const PX_PER_MINUTE = 10;
const MINUTES_PER_MS = 60 * 1000;

function px(ms) {
  return ms / MINUTES_PER_MS * PX_PER_MINUTE;
}

export default function timeStyles(range, container) {
  const duration = range.duration / container.duration;
  const positionStyles = timePositionStyles(range.start, container);
  return `${positionStyles} height: ${duration * 100}%;`;
}

export function timePositionStyles(start, container) {
  start = start.diff(container.start) / container.duration;
  return `top: ${start * 100}%;`;
}
