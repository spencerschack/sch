import Ember from 'ember';
import {positionStyles} from '../utils/range';

export function rangePositionStyles([start, container]) {
  return positionStyles(start, container);
}

export default Ember.Helper.helper(rangePositionStyles);
