import Ember from 'ember';
import timeStylesHelper from '../utils/time-styles';

export function timeStyles([range, container]) {
  return timeStylesHelper(range, container);
}

export default Ember.Helper.helper(timeStyles);
