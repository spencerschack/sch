import Ember from 'ember';
import service from 'ember-service/inject';
import {alias, observes} from 'ember-computed-decorators';

export default Ember.Helper.extend({

  clock: service(),

  @alias('clock.moment') now,

  @observes('now')
  update() {
    this.recompute();
  },

  compute() {
    return this.get('now');
  }

});
