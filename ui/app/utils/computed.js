import computed, {on as onMacro} from 'ember-computed-decorators';
import curriedComputed from 'ember-macro-helpers/curried-computed';
import {styles, positionStyles} from './range';

export const rangeStyles = curriedComputed((range, container) => {
  return styles(range, container);
});

export const rangePositionStyles = curriedComputed((range, container) => {
  return positionStyles(range, container);
});

export const equalMoments = curriedComputed((a, b) => {
  return a && a.isSame(b);
});
