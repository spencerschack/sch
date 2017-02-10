import Ember from 'ember';
import computed from 'ember-computed-decorators';
import {task, timeout} from 'ember-concurrency';
import moment from 'moment';
import {timePositionStyles} from '../../utils/computed';

export default Ember.Component.extend({

  localClassNames: ['container'],

  attributeBindings: ['style'],

  style: timePositionStyles('now', 'range'),

  @computed
  now() {
    this.get('tick').perform();
    return moment();
  },

  tick: task(function * () {
    yield timeout(1000);
    this.notifyPropertyChange('now');
  }).drop()

});
