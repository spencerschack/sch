import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({

  tagName: '',

  actions: {

    finish() {
      const current = this.get('current');
      current.set('finish', moment());
      current.save();
    }

  }

});
