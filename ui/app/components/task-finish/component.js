import Ember from 'ember';
import {on} from 'ember-computed-decorators';

export default Ember.Component.extend({

  localClassNames: ['button'],

  @on('click')
  finish() {
    const task = this.get('task');
    task.set('finish', moment());
    task.save();
  },

  actions: {

    finish() {
      this.finish();
    }

  }

});
