import Ember from 'ember';
import moment from 'moment';
import {typeOf} from 'ember-utils';

export function formatDuration([duration, format = "hh:mm:ss"], options) {
  if(typeOf(duration) === 'number')
    duration = moment.duration(duration);
  return duration && duration.format(format, options);
}

export default Ember.Helper.helper(formatDuration);
