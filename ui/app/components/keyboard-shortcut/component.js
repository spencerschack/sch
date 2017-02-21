import Ember from 'ember';
import {on} from 'ember-computed-decorators';
import {
  EKMixin,
  EKOnInsertMixin,
  keyDown,
  keyUp
} from 'ember-keyboard';

export default Ember.Component.extend(
  EKMixin,
  EKOnInsertMixin,
{

  localClassNames: ['container'],
  localClassNameBindings: ['isActive'],

  isActive: false,

  @on('didInsertElement')
  registerListener() {
    const shortcut = this.get('shortcut');
    this.on(keyDown(shortcut), () => this.set('isActive', true));
    this.on(keyUp(shortcut), () => {
      this.set('isActive', false);
      this.sendAction();
    });
  }

});
