import computed from 'ember-computed';
import timeStylesHelper, {timePositionStyles as timePositionStylesHelper} from './time-styles';

export function timeStyles(rangeKey, containerKey) {
  return computed(rangeKey, containerKey, function() {
    return timeStylesHelper(this.get(rangeKey), this.get(containerKey));
  });
}

export function timePositionStyles(rangeKey, containerKey) {
  return computed(rangeKey, containerKey, function() {
    return timePositionStylesHelper(this.get(rangeKey), this.get(containerKey));
  });
}
