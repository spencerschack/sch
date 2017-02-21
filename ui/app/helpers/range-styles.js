import Ember from 'ember';
import {styles} from '../utils/range';

export function rangeStyles([range, container]) {
  return styles(range, container);
}

export default Ember.Helper.helper(rangeStyles);
