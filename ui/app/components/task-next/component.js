import Ember from 'ember';
import moment from 'moment';
import styles from './styles';

export default Ember.Component.extend({

  tagName: '',

  isOpen: false,

  actions: {

    open() {
      this.set('isOpen', true);
      Ember.run.schedule('afterRender', () => {
        Ember.$(`.${styles.input}`).focus();
      });
    },

    close() {
      this.set('isOpen', false);
    },

    create(name) {
      const start = moment();
      const current = this.get('current');
      if(current) {
        current.set('finish', start);
        current.save();
      }
      this.sendAction('create', {start, name});
      this.send('close');
    }

  }

});
