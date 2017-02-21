import EmberObject from 'ember-object';
import computed from 'ember-computed-decorators';
import {typeOf} from 'ember-utils';

export function styles(range, container) {
  const duration = container.coverageOf(range);
  const position = positionStyles(range, container);
  return `${position} height: ${duration * 100}%;`.htmlSafe();
}

export function positionStyles(range, container) {
  return `top: ${container.positionOf(range) * 100}%;`.htmlSafe();
}

function isNumber(arg) {
  return typeOf(arg) === 'number';
}

export default EmberObject.extend({

  start: null,
  duration: null,

  @computed('start', 'duration')
  center(start, duration) {
    return start.clone().add(duration / 2);
  },

  @computed('start', 'duration')
  finish(start, duration) {
    return start.clone().add(duration);
  },

  momentAt(position) {
    const diff = position * this.get('duration');
    return this.get('start').clone().add(diff);
  },

  positionOf(other) {
    other = isNumber(other) ? other : other.get('start');
    return other.diff(this.get('start')) / this.get('duration');
  },

  coverageOf(other) {
    other = isNumber(other) ? other : other.get('duration');
    return other / this.get('duration');
  },

  contains(other) {
    const start = this.get('start');
    const finish = start.clone().add(this.get('duration'));
    return other.isBetween(start, finish);
  },

  toFilter() {
    const start = this.get('start').toJSON();
    const finish = this.get('finish').toJSON();
    return {start, finish};
  }

}).reopenClass({

  invalid() {
    return this.create({start: moment.invalid(), duration: NaN});
  },

  create({start, finish, duration, center}) {
    if(start === undefined) {
      start = moment(center).subtract(duration / 2);
    } else if(duration === undefined) {
      duration = finish.diff(start);
    }
    return this._super({start, duration});
  }

});
