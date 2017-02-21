import Ember from 'ember';
import service from 'ember-service/inject';

export default Ember.Route.extend({

  auth: service(),

  model({token}) {
    return this.get('store').createRecord('tokenRequest',
      {temporaryToken: token}).save();
  },

  afterModel(model) {
    this.get('auth').updateToken(model.get('persistentToken'));
    this.transitionTo('index');
  }

});
