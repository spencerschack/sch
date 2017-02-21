import Ember from 'ember';
import service from 'ember-service/inject';

export default Ember.Component.extend({

  tagName: '',

  store: service(),

  showMenu: false,

  actions: {

    showMenu() {
      this.set('showMenu', true);
    },

    hideMenu() {
      this.set('showMenu', false);
    },

    start(project) {
      const start = moment();
      const lastTask = this.get('lastTask');
      if(lastTask) {
        lastTask.set('finish', start);
        lastTask.save();
      }
      this.get('store').createRecord('task', {start, project}).save();
      this.get('store').createRecord('pomodoro', {start, kind: 'pomodoro'}).save();
    }

  }

});
