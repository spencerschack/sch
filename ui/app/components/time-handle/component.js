import Ember from 'ember';
import {on} from 'ember-computed-decorators';

export default Ember.Component.extend({

  localClassNames: ['container'],

  @on('mouseDown')
  beginDrag(event) {
    event.preventDefault();
    const onMouseMove = event => {
      this.sendAction('drag', event);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

});
