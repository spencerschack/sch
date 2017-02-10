import Ember from 'ember';
import service from 'ember-service/inject';
import {task, timeout} from 'ember-concurrency';
import computed from 'ember-computed-decorators';
import moment from 'moment';
import {blur} from '../../utils/content-editable';
import {timeStyles} from '../../utils/computed';

function equalMoments(a, b) {
  return Ember.computed(a, b, function() {
    const aMoment = this.get(a);
    return aMoment && aMoment.isSame(this.get(b));
  });
}

export default Ember.Component.extend({

  store: service(),

  localClassNames: ['container'],
  localClassNameBindings: [
    'task.finish:is-finished:is-unfinished',
    'isAdjacentAfter', 'isAdjacentBefore'
  ],

  attributeBindings: ['style'],

  style: timeStyles('range', 'containerRange'),

  isAdjacentBefore: equalMoments('task.start', 'task.previous.finish'),
  isAdjacentAfter: equalMoments('task.finish', 'task.next.start'),

  @computed('task.start,task.duration,now')
  range(start, duration, now) {
    return {start, duration: duration || now.diff(start)};
  },

  @computed
  now() {
    if(!this.get('task.finish'))
      this.get('tick').perform();
    return moment();
  },

  tick: task(function * () {
    yield timeout(1000);
    this.notifyPropertyChange('now');
  }).drop(),

  save: task(function * () {
    const task = this.get('task');
    if(task.get('hasDirtyAttributes') || task.get('isNew')) {
      yield timeout(500);
      yield task.save();
    }
  }).restartable(),

  actions: {

    blur,

    destroy() {
      this.get('task').destroyRecord();
    }

  }

});
