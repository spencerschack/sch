import Ember from 'ember';
import service from 'ember-service/inject';
import computed, {observes} from 'ember-computed-decorators';

export default Ember.Component.extend({

  store: service(),

  localClassNames: ['tasks-timeline'],

  @computed('time')
  tasks(time) {
    return this.get('store').findAll('task');
  },

  @observes('tasks.[]')
  markTaskNeighbors() {
    this.get('tasks').forEach((task, index, tasks) => {
      task.set('previous', tasks.objectAt(index - 1));
      task.set('next', tasks.objectAt(index + 1));
    });
  },

  @computed('time')
  range(start) {
    return {start, duration: 1000 * 60 * 60 * 12};
  }

});
