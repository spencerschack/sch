import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('keyboard-shortcut', 'Integration | Component | keyboard shortcut', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{keyboard-shortcut}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#keyboard-shortcut}}
      template block text
    {{/keyboard-shortcut}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
