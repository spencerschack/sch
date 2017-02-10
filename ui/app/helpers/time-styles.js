import Ember from 'ember';

const PX_PER_MINUTE = 10;
const MINUTES_PER_MS = 60 * 1000;

function px(ms) {
  return ms / MINUTES_PER_MS * PX_PER_MINUTE;
}

export function timeStyles([range, container]) {
  const duration = range.duration / container.duration;
  const start = range.start.diff(container.start) / container.duration;
  return `top: ${start * 100}%; height: ${duration * 100}%;`;
}

export default Ember.Helper.helper(timeStyles);
