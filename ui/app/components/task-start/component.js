import Ember from 'ember';
import {on} from 'ember-computed-decorators';
import service from 'ember-service/inject';

export default Ember.Component.extend({

  store: service(),

  localClassNames: ['task-start'],

  href: '',

  @on('click')
  startTask() {
    const now = new Date();
    this.finishLastTask(now);
    this.createTask(now);
  },

  finishLastTask(finish) {
    const lastTask = this.get('lastTask');
    if(!lastTask.get('finish')) {
      lastTask.set('finish', finish);
      lastTask.save();
    }
  },

  createTask(start) {
    this.get('store').createRecord('task', {start});
  }

});
