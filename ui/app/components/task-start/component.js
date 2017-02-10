import Ember from 'ember';
import {on} from 'ember-computed-decorators';
import service from 'ember-service/inject';
import moment from 'moment';

export default Ember.Component.extend({

  store: service(),

  localClassNames: ['task-start'],

  href: '',

  @on('click')
  startTask() {
    const now = moment();
    this.finishLastTask(now);
    this.createTask(now);
  },

  finishLastTask(finish) {
    const lastTask = this.get('lastTask');
    if(lastTask && !lastTask.get('finish')) {
      lastTask.set('finish', finish);
      lastTask.save();
    }
  },

  createTask(start) {
    this.get('store').createRecord('task', {start});
  }

});
