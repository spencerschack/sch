import Mixin from 'ember-metal/mixin';
import attr from 'ember-data/attr';
import computed, {bool, not} from 'ember-computed-decorators';
import moment from 'moment';

export default Mixin.create({

  start: attr('moment'),
  finish: attr('moment'),

  @bool('finish') isFinished,
  @not('isFinished') isUnfinished,

  @computed('start', 'finish')
  duration(start, finish) {
    if(finish)
      return finish.diff(start);
  },

  rangeOrNow() {
    const start = this.get('start');
    const finish = this.get('finish') || moment();
    return Range.create({start, finish});
  }

});
