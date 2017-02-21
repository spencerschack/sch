import {on} from 'ember-computed-decorators';

export function onRemoteEvent(element, name) {
  name = name.toLowerCase();
  return function(target, property, descriptor) {
    return on('init')(target, property, {
      ...descriptor,
      value() {
        const fn = this::descriptor.value;
        this.on('didInsertElement', () =>
          element.addEventListener(name, fn));
        this.on('willDestroyElement', () =>
          element.removeEventListener(name, fn));
      }
    });
  }
}
