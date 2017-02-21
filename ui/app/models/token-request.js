import DS from 'ember-data';

export default DS.Model.extend({

  temporaryToken: DS.attr('string'),
  persistentToken: DS.attr('string')

});
