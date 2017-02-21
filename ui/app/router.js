import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('tasks', {path: '/tasks/:year/:month/:day/:hour'});

  this.route('login', function() {
    this.route('token', {path: '/:token'});
  });
});

export default Router;
