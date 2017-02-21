import Ember from 'ember';
import RSVP from 'rsvp';
import moment from 'moment';
import Range from '../utils/range';
import {isStartOf} from '../utils/moment';

export default Ember.Route.extend({

  serialize(moment) {
    const year = moment.year();
    const month = moment.month() + 1;
    const day = moment.date();
    const hour = moment.hour();
    return {year, month, day, hour};
  },

  model({year, month, day, hour}) {
    return moment([year, month - 1, day, hour]);
  },

  actions: {

    travel(time) {
      const target = moment(time).startOf('hour');
      const model = moment(this.modelFor('tasks')).startOf('hour');
      if(!model.isSame(target))
        this.replaceWith('tasks', time);
    }

  }

});
