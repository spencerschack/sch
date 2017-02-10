import Ember from 'ember';
import {task, timeout} from 'ember-concurrency';
import moment from 'moment';
import {blur} from '../../utils/content-editable';

export default Ember.Component.extend({

  tagName: '',

  save: task(function * () {
    const task = this.get('task');
    if(task.get('hasDirtyAttributes') || task.get('isNew')) {
      yield timeout(500);
      yield task.save();
    }
  }).restartable(),

  actions: {

    blur,

    finish() {
      this.set('task.finish', moment());
      this.send('save');
    },

    destroy() {
      this.get('task').destroyRecord();
    }

  }

});
