import DS from 'ember-data';
import service from 'ember-service/inject';
import computed from 'ember-computed-decorators';

export default DS.Model.extend({

  moment: service(),

  name: DS.attr('string'),
  start: DS.attr('date'),
  finish: DS.attr('date'),

  @computed('start', 'finish')
  duration(start, finish) {
    start = this.get('moment').moment(start);
    if(finish) {
      finish = this.get('moment').moment(finish);
      return finish.diff(start);
    }
  }

});
