import Ember from 'ember';
import computed from 'ember-computed-decorators';

export default Ember.Component.extend({

  localClassNames: ['timeline-task'],

  attributeBindings: ['style'],

  @computed('task.duration')
  style(duration) {
    const minutes = duration / 1000 / 60;
    return `height: ${minutes * 10}px`;
  },

  actions: {

    save(){
      const task = this.get('task');
      if(task.get('hasDirtyAttributes') || task.get('isNew'))
        this.get('task').save();
    },

    finish() {
      this.set('task.finish', new Date());
      this.send('save');
    },

    blur(event) {
      const input = document.createElement('input');
      input.style.position = 'absolute';
      input.style.top = 0;
      document.body.appendChild(input);
      input.focus();
      document.body.removeChild(input);
    },

    destroy() {
      this.get('task').destroyRecord();
    }

  }

});
