import Ember from 'ember';
import service from 'ember-service/inject';
import moment from 'moment';

export default Ember.Component.extend({

  store: service(),

  tagName: '',

  actions: {

    start() {
      const now = moment();
      const current = this.get('current');
      current.set('finish', now);
      current.save();
      const kind = current.get('isBreak') ? 'pomodoro' : 'break';
      this.sendAction('create', {start: now, kind});
    }

  }

});
