import Ember from 'ember';
import service from 'ember-service/inject';
import computed, {equal} from 'ember-computed-decorators';
import {onRemoteEvent} from '../../utils/component';

export default Ember.Component.extend({

  clock: service(),

  tagName: '',

  @equal('state', 'between') isBetween,
  @equal('state', 'before') isBefore,

  @computed('clock.moment', 'visibleRange')
  state(now, range) {
    if(!range || range.contains(now)) {
      return 'between';
    } else if(now.isBefore(range.get('start'))) {
      return 'before';
    } else {
      return 'after';
    }
  },

  actions: {

    travelToNow() {
      this.sendAction('travel', this.get('clock.moment'));
    }

  }

});
