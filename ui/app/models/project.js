import DS from 'ember-data';
import computed, {equal} from 'ember-computed-decorators';

export default DS.Model.extend({

  name: DS.attr('string'),

  parent: DS.belongsTo('project', {inverse: 'children', async: false}),
  children: DS.hasMany('project', {inverse: 'parent', async: false}),
  tasks: DS.hasMany({async: false}),

  @equal('parent', null) isRoot,

  @computed('name', 'parent.nameWithAncestry')
  nameWithAncestry(name, parent) {
    return parent ? `${parent} ${name}` : name;
  }

});
