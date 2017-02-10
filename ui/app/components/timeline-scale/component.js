import Ember from 'ember';
import computed from 'ember-computed-decorators';

const duration = 1000 * 60 * 60;

export default Ember.Component.extend({

  @computed('range')
  hours(range) {
    const end = range.start.clone().add(range.duration);
    const hours = end.diff(range.start, 'hours');
    return new Array(hours).fill().map((_, diff) => {
      return {start: range.start.clone().add(diff, 'hours'), duration};
    });
  }

});
