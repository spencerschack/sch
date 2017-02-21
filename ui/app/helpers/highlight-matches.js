import Ember from 'ember';

export function highlightMatches([value, query], {class: className}) {
  console.log(value, query, className);
  return value;
}

export default Ember.Helper.helper(highlightMatches);
