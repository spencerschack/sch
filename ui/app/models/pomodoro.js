import DS from 'ember-data';
import run from 'ember-runloop';
import computed, {equal} from 'ember-computed-decorators';
import moment from 'moment';
import TimeRange from './mixins/time-range';
import Adjacent from './mixins/adjacent';

const durations = {
  pomodoro: 25 * 60 * 1000,
  break: 5 * 60 * 1000
};

export default DS.Model.extend(
  TimeRange,
  Adjacent('pomodoro'),
{

  kind: DS.attr('string'),

  @equal('kind', 'pomodoro') isPomodoro,
  @equal('kind', 'break') isBreak,

  @computed('start', 'kind')
  target(start, kind) {
    const duration = durations[kind];
    return start.clone().add(duration);
  },

  @computed('target')
  isComplete(target) {
    const now = moment();
    const isComplete = target.isBefore(now);
    if(!isComplete)
      run.later(
        () => this.notifyPropertyChange('isComplete'),
        now.diff(target));
    return isComplete;
  }

});
