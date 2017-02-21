import DS from 'ember-data';
import service from 'ember-service/inject';
import computed from 'ember-computed-decorators';

export default DS.JSONAPIAdapter.extend({

  auth: service(),

  namespace: 'api',

  @computed('auth.token')
  headers(token) {
    return {Authorization: `Token token=${token}`};
  },

  pathForType(modelName) {
    return modelName.underscore().pluralize();
  }

});
