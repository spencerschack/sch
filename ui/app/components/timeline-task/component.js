import Ember from 'ember';
import service from 'ember-service/inject';
import {task, timeout} from 'ember-concurrency';
import computed from 'ember-computed-decorators';
import Range from '../../utils/range';
import {rangeStyles} from '../../utils/computed';

export default Ember.Component.extend({

  store: service(),
  clock: service(),

  localClassNames: ['container'],
  localClassNameBindings: [
    "task.finish:is-finished:is-unfinished",
    "task.isAdjacentBefore:is-adjacent-before",
    "task.isAdjacentAfter:is-adjacent-after"
  ],

  attributeBindings: ['style'],
  style: rangeStyles('range', 'containerRange'),

  @computed('task.start,task.duration,clock.moment')
  range(start, duration, now) {
    return Range.create({start, duration: duration || now.diff(start)});
  },

  save: task(function * () {
    const task = this.get('task');
    if(task.get('hasDirtyAttributes') || task.get('isNew')) {
      yield timeout(500);
      task.save();
    }
  }).restartable(),

  actions: {

    drag(attribute, {clientY: coordinate}) {
      const {top, bottom, height} = this.element.getBoundingClientRect();
      const msPerPixel = this.get('range.duration') / height;
      const pixelDiff = attribute === 'start' ?
        coordinate - top :
        bottom - coordinate;
      const msDiff = pixelDiff * msPerPixel;
      const task = this.get('task');
      const time = task.get(attribute).clone();
      task.set(attribute, time.add(msDiff));
    },

    destroy() {
      this.get('task').destroyRecord();
    }

  }

});
