import Mixin from 'ember-metal/mixin';
import DS from 'ember-data';
import {equalMoments} from '../../utils/computed';

export default function(modelName) {
  return Mixin.create({

    next: DS.belongsTo(modelName, {async: false, inverse: 'previous'}),
    previous: DS.belongsTo(modelName, {async: false, inverse: 'next'}),

    isAdjacentBefore: equalMoments('start', 'previous.finish'),
    isAdjacentAfter: equalMoments('finish', 'next.start')

  });
};
