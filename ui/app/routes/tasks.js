import Ember from 'ember';
import moment from 'moment';

export default Ember.Route.extend({

  serialize(date) {
    const year = date.year();
    const month = date.month() + 1;
    const day = date.date();
    const hour = date.hour();
    return {year, month, day, hour};
  },

  model({year, month, day, hour}) {
    return moment([year, month - 1, day, hour]);
  }

});
