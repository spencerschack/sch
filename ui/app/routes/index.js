import Ember from 'ember';
import moment from 'moment';

export default Ember.Route.extend({

  redirect() {
    this.transitionTo('tasks', moment());
  }

});
