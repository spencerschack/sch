import Ember from 'ember';
import computed from 'ember-computed-decorators';
import Range from '../../utils/range';

const duration = 1000 * 60 * 60;

export default Ember.Component.extend({

  localClassNames: ['container'],

  @computed('range')
  hours(range) {
    const finish = range.get('finish').clone().endOf('hour');
    const start = range.get('start').clone().startOf('hour');
    const hours = finish.diff(start, 'hours');
    return new Array(hours).fill().map((_, diff) => {
      const hour = start.clone().add(diff, 'hours');
      return Range.create({start: hour, duration});
    });
  }

});
