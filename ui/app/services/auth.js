import Ember from 'ember';
import {on} from 'ember-computed-decorators';

const key = 'sch:token';

export default Ember.Service.extend({

  token: null,

  @on('init')
  setToken() {
    this.set('token', localStorage.getItem(key));
  },

  updateToken(token) {
    this.set('token', token);
    localStorage.setItem(key, token);
  }

});
