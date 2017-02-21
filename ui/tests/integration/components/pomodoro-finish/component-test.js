import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pomodoro-finish', 'Integration | Component | pomodoro finish', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pomodoro-finish}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#pomodoro-finish}}
      template block text
    {{/pomodoro-finish}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
