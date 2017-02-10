import Ember from 'ember';
import service from 'ember-service/inject';
import computed from 'ember-computed-decorators';

export default Ember.Component.extend({

  store: service(),

  localClassNames: ['tasks-timeline'],

  @computed('time')
  tasks(time) {
    return this.get('store').findAll('task');
  },

  @computed('time')
  range(start) {
    return {start, duration: 1000 * 60 * 60 * 12};
  }

});
