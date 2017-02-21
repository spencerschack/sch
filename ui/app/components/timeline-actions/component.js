import Ember from 'ember';
import computed, {on} from 'ember-computed-decorators';
import {task, timeout} from 'ember-concurrency';
import service from 'ember-service/inject';
import moment from 'moment';
import {rangePositionStyles} from '../../utils/computed';

export default Ember.Component.extend({

  store: service(),
  clock: service(),

  localClassNames: ['container'],

  attributeBindings: ['style'],

  style: rangePositionStyles('clock.moment', 'range'),

  actions: {

    finish(finish = moment()) {
      const lastTask = this.get('lastTask');
      if(lastTask && !lastTask.get('finish')) {
        lastTask.set('finish', finish);
        lastTask.save();
      }
    },

    start() {
      const start = moment();
      if(this.get('lastTask'))
        this.send('finish', start);
      this.get('store').createRecord('task', {start});
    }

  }

});
