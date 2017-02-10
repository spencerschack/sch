import DS from 'ember-data';
import service from 'ember-service/inject';
import computed from 'ember-computed-decorators';

export default DS.Model.extend({

  name: DS.attr('string'),
  start: DS.attr('moment'),
  finish: DS.attr('moment'),

  @computed('start', 'finish')
  duration(start, finish) {
    if(finish)
      return finish.diff(start);
  }

});
