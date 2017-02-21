import Clock from 'ember-cli-clock/services/clock';
import computed from 'ember-computed-decorators';
import moment from 'moment';

export default Clock.extend({

  interval: 1000,

  @computed('date')
  moment(date) {
    return moment(date);
  }

});
