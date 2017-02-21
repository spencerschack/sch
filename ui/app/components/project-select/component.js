import Ember from 'ember';
import service from 'ember-service/inject';
import computed, {on, filterBy} from 'ember-computed-decorators';

export default Ember.Component.extend({

  localClassNames: ['container'],

  store: service(),

  @computed
  projects() {
    return this.get('store').query('project', {});
  },

  @on('didInsertElement')
  focusInput() {
    this.$('input').focus();
  },

  @filterBy('projects', 'isRoot') roots

});
