import Ember from 'ember';

export default Ember.Route.extend({

  model() {
    return this.get('store').createRecord('loginRequest');
  },

  actions: {

    request() {
      const model = this.modelFor(this.routeName);
      if(model.get('email')) {
        model.save();
      }
    }

  }

});
