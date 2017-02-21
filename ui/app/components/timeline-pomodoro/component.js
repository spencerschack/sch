import Ember from 'ember';
import moment from 'moment';
import service from 'ember-service/inject';
import {task, timeout} from 'ember-concurrency';
import computed from 'ember-computed-decorators';
import Range from '../../utils/range';
import {rangeStyles} from '../../utils/computed';

const threshold = moment.duration(1, 'minute').as('ms');

export default Ember.Component.extend({

  clock: service(),

  tagName: '',

  @computed('pomodoro.start,pomodoro.finish,clock.moment')
  range(start, finish, now) {
    return Range.create({start, finish: finish || now});
  },

  @computed('pomodoro.target,range.finish')
  showExcess(target, now) {
    return now.diff(target) > threshold;
  }

});
