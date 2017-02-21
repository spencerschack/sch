import Ember from 'ember';

export default Ember.Service.extend({

  send(message, options = {}) {
    switch(Notification.permission) {
      case 'granted':
        new Notification(message, options);
        break;
      case 'default':
        Notification.requestPermission(() => this.send(message));
        break;
    }
  }

});
