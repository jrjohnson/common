import Model, { hasMany, belongsTo, attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { all } from 'rsvp';
import striptags from 'striptags';

export default Model.extend({
  title: attr('string'),
  position: attr('number', { defaultValue: 0 }),
  active: attr('boolean', { defaultValue: true }),
  session: belongsTo('session', { async: true }),
  terms: hasMany('term', { async: true }),
  meshDescriptors: hasMany('mesh-descriptor', { async: true }),
  ancestor: belongsTo('session-objective', {
    inverse: 'descendants',
    async: true,
  }),
  descendants: hasMany('session-objective', {
    inverse: 'ancestor',
    async: true,
  }),
  courseObjectives: hasMany('course-objective', {
    inverse: 'sessionObjectives',
    async: true,
  }),

  /**
   * A list of all vocabularies that are associated via terms.
   * @property associatedVocabularies
   * @type {Ember.computed}
   * @public
   */
  associatedVocabularies: computed('terms.@each.vocabulary', async function () {
    const terms = await this.terms;
    const vocabularies = await all(terms.toArray().mapBy('vocabulary'));
    return vocabularies.uniq().sortBy('title');
  }),

  /**
   * A list containing all associated terms and their parent terms.
   * @property termsWithAllParents
   * @type {Ember.computed}
   * @public
   */
  termsWithAllParents: computed('terms.[]', async function () {
    const terms = await this.terms;
    const allTerms = await all(terms.toArray().mapBy('termWithAllParents'));
    return allTerms
      .reduce((array, set) => {
        array.pushObjects(set);
        return array;
      }, [])
      .uniq();
  }),

  /**
   * @todo check if this method is obsolete, if so remove it [ST 2020/07/08]
   */
  shortTitle: computed('title', function () {
    const title = this.title;
    if (title === undefined) {
      return '';
    }
    return title.substr(0, 200);
  }),

  textTitle: computed('title', function () {
    return striptags(this.title);
  }),
});
