import Ember from 'ember';
import service from 'ember-service/inject';
import moment from 'moment';

export default Ember.Route.extend({

  auth: service(),

  redirect() {
    if(this.get('auth.token')) {
      this.transitionTo('tasks', moment());
    } else {
      this.transitionTo('login');
    }
  }

});
