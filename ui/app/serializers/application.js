import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({

  normalizeQueryRecordResponse(store, primaryModelClass, payload, id, requestType) {
    payload.data = payload.data[0];
    return this._super(store, primaryModelClass, payload, id, requestType);
  }

});
