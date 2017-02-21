import Ember from 'ember';

export function momentDiff([a, b]) {
  return a && a.diff(b);
}

export default Ember.Helper.helper(momentDiff);
