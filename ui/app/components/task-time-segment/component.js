import Ember from 'ember';
import computed, {on} from 'ember-computed-decorators';

export default Ember.Component.extend({

  localClassNames: ['task-time-segment'],

  attributeBindings: ['tabindex'],

  tabindex: -1,

  @computed('time')
  value: {
    get(time) {
      return time.format(this.get('format'));
    },
    set(value, time) {
      const segment = this.get('segment');
      time = this.set('time', time.clone()[segment](value));
      this.sendAction('save');
      return time.format(this.get('format'));
    }
  },

  keyDown(event) {
    switch(event.which) {
      case 13: this.element.blur(); break;
      case 38: this.incrementProperty('value'); break;
      case 40: this.decrementProperty('value'); break;
      default: if(event.which >= 48 && event.which <= 57) {
        const secondDigit = this.get('value')[1];
        const newDigit = event.which - 48;
        this.set('value', secondDigit + newDigit);
      } else return;
    }
    event.preventDefault();
  }

});
