import Mixin from 'ember-metal/mixin';

export default Mixin.create({

  attrs: {
    previous: {serialize: false},
    next: {serialize: false}
  },

  normalizeArrayResponse(store, primaryModelClass, payload, id, requestType) {
    const type = primaryModelClass.modelName;
    payload.data.forEach((record, index) => {
      const previous = payload.data[index - 1];
      const next = payload.data[index + 1];
      if(!record.relationships)
        record.relationships = {};
      if(previous)
        record.relationships.previous = {data: {id: previous.id, type}};
      if(next)
        record.relationships.next = {data: {id: next.id, type}};
    });
    return this._super(store, primaryModelClass, payload, id, requestType);
  }

});
