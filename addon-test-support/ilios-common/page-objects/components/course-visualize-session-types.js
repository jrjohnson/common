import { create, text } from 'ember-cli-page-object';

const definition = create({
  scope: '[data-test-course-visualize-session-types]',
  title: text('[data-test-title]'),
});

export default definition;
export const component = create(definition);
