import Ember from 'ember';
import {on} from 'ember-computed-decorators';

export default Ember.Component.extend({

  localClassNames: ['button'],

  @on('click')
  start() {
    const start = moment();
    const lastTask = this.get('lastTask');
    if(lastTask) {
      lastTask.set('finish', start);
      lastTask.save();
    }
    this.get('store').createRecord('task', {start});
  }

});
