import Ember from 'ember';
import service from 'ember-service/inject';
import moment from 'moment';
import run from 'ember-runloop';
import computed, {on, observes} from 'ember-computed-decorators';
import {task} from 'ember-concurrency';
import {onRemoteEvent} from '../../utils/component';
import {rect} from '../../utils/dom';
import Range from '../../utils/range';

const duration = moment.duration(1, 'day');
const threshold = moment.duration(8, 'hours').as('ms');

export default Ember.Component.extend({

  store: service(),

  localClassNames: ['tasks-timeline'],

  visibleRange: Range.invalid(),

  @onRemoteEvent(window, 'scroll')
  updateVisibleRange() {
    const {top, height} = this.element::rect();
    const range = this.get('range');
    const start = range.momentAt(-top / height);
    const finish = range.momentAt((window.innerHeight - top) / height);
    this.set('visibleRange', Range.create({start, finish}));
  },

  @observes('visibleRange.center')
  notifyTravel() {
    this.sendAction('travel', this.get('visibleRange.center'));
  },

  @observes('time')
  @on('didInsertElement')
  scrollToCenter() {
    const time = this.get('time');
    if(!this.get('visibleRange.center').isSame(time))
      run.schedule('afterRender', () => this.scrollTo(time));
  },

  @computed
  range() {
    return Range.create({center: this.get('time'), duration});
  },

  @observes('time')
  updateRange() {
    const diff = this.get('time').diff(this.get('range.center'));
    if(Math.abs(diff) > threshold) {
      this.notifyPropertyChange('range');
      run.schedule('afterRender', () => this.scrollTo(this.get('time')));
    }
  },

  loadRecords: task(function * () {
    const store = this.get('store');
    const filter = this.get('range').toFilter();
    const tasks = store.query('task', {include: 'project', filter});
    const pomodoros = store.query('pomodoro', {filter});
    yield tasks; yield pomodoros;
    this.set('tasks', tasks.toArray());
    this.set('pomodoros', pomodoros.toArray());
  }).keepLatest().on('init').observes('range'),

  scrollTo(moment) {
    window.scrollTo(0, this.scrollFromMoment(moment));
  },

  scrollFromMoment(moment) {
    const coordinates = this.coordinatesFromMoment(moment);
    return coordinates - window.innerHeight / 2;
  },

  coordinatesFromMoment(moment) {
    const {top, height} = this.element::rect();
    const position = this.get('range').positionOf(moment);
    return window.scrollY + top + height * position;
  },

  actions: {

    createPomodoro(attrs) {
      const next = this.get('store').createRecord('pomodoro', attrs);
      const pomodoros = this.get('pomodoros');
      const previous = pomodoros.get('lastObject');
      if(previous) {
        previous.set('next', next);
        next.set('previous', previous);
      }
      pomodoros.pushObject(next);
      return next.save();
    },

    createTask(attrs) {
      const next = this.get('store').createRecord('task', attrs);
      const tasks = this.get('tasks');
      const previous = tasks.get('lastObject');
      if(previous) {
        previous.set('next', next);
        next.set('previous', previous);
      }
      tasks.pushObject(next);
      if(!this.get('pomodoros.lastObject.isUnfinished')) {
        this.send('createPomodoro', {start: attrs.start, kind: 'pomodoro'});
      }
      return next.save();
    }

  }

});
