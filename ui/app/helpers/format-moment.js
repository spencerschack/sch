import Ember from 'ember';

export function formatMoment([moment, format = "HH:mm:ss"]) {
  return moment.format && moment.format(format);
}

export default Ember.Helper.helper(formatMoment);
