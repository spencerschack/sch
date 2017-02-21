import DS from 'ember-data';
import TimeRange from './mixins/time-range';
import Adjacent from './mixins/adjacent';

export default DS.Model.extend(
  TimeRange,
  Adjacent('task'),
{

  name: DS.attr('string'),

  project: DS.belongsTo({async: false})

});
