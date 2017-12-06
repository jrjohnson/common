import moment from 'moment';
import DS from 'ember-data';
import Ember from 'ember';
import PublishableModel from 'ilios-common/mixins/publishable-model';
import CategorizableModel from 'ilios-common/mixins/categorizable-model';
import SortableByPosition from 'ilios-common/mixins/sortable-by-position';

const { computed, RSVP, isEmpty } = Ember;
const { filterBy, mapBy, sum } = computed;
const { all, map, Promise } = RSVP;
const { attr, belongsTo, hasMany, Model } = DS;

export default Model.extend(PublishableModel, CategorizableModel, SortableByPosition, {
  title: attr('string'),
  level: attr('number'),
  year: attr('number'),
  startDate: attr('date'),
  endDate: attr('date'),
  externalId: attr('string'),
  locked: attr('boolean'),
  archived: attr('boolean'),
  clerkshipType: belongsTo('course-clerkship-type', {async: true}),
  school: belongsTo('school', {async: true}),
  directors: hasMany('user', {
    async: true,
    inverse: 'directedCourses'
  }),
  administrators: hasMany('user', {
    async: true,
    inverse: 'administeredCourses'
  }),
  cohorts: hasMany('cohort', {async: true}),
  objectives: hasMany('objective', {async: true}),
  meshDescriptors: hasMany('mesh-descriptor', {async: true}),
  learningMaterials: hasMany('course-learning-material', {async: true}),
  sessions: hasMany('session', {async: true}),
  ancestor: belongsTo('course', {
    inverse: 'descendants',
    async: true
  }),
  descendants: hasMany('course', {
    inverse: 'ancestor',
    async: true
  }),
  academicYear: computed('year', function(){
    return this.get('year') + ' - ' + (parseInt(this.get('year')) + 1);
  }),

  /**
   * All competencies linked to this course via its objectives.
   * @property competencies
   * @type {Ember.computed}
   * @public
   */
  competencies: computed('objectives.@each.treeCompetencies', async function(){
    const objectives = await this.get('objectives');
    const trees = await all(objectives.mapBy('treeCompetencies'));
    const competencies = trees.reduce((array, set) => {
      return array.pushObjects(set);
    }, []);
    return competencies.uniq().filter(item => {
      return !isEmpty(item);
    });
  }),

  /**
   * All competency domains linked to this course via its objectives.
   * @property domains
   * @type {Ember.computed}
   * @public
   */
  domains: computed('competencies.@each.domain', function(){
    return new Promise(resolve => {
      let domainContainer = {};
      let domainIds = [];
      let promises = [];
      this.get('competencies').then(competencies => {
        competencies.forEach(competency => {
          promises.pushObject(competency.get('domain').then(domain => {
            if(!domainContainer.hasOwnProperty(domain.get('id'))){
              domainIds.pushObject(domain.get('id'));
              domainContainer[domain.get('id')] = Ember.ObjectProxy.create({
                content: domain,
                subCompetencies: []
              });
            }
            if(competency.get('id') !== domain.get('id')){
              let subCompetencies = domainContainer[domain.get('id')].get('subCompetencies');
              if(!subCompetencies.includes(competency)){
                subCompetencies.pushObject(competency);
                domainContainer[domain.get('id')].set('subCompetencies', subCompetencies.sortBy('title'));
              }
            }
          }));
        });

        all(promises).then(() => {
          let domains = domainIds.map(id => {
            return domainContainer[id];
          }).sortBy('title');

          resolve(domains);
        });
      });
    });
  }),

  publishedSessions: filterBy('sessions', 'isPublished'),
  publishedSessionOfferings: mapBy('publishedSessions', 'offerings'),
  publishedSessionOfferingCounts: mapBy('publishedSessionOfferings', 'length'),
  publishedOfferingCount: sum('publishedSessionOfferingCounts'),
  setDatesBasedOnYear: function(){
    let today = moment();
    let firstDayOfYear = moment(this.get('year') + '-7-1', "YYYY-MM-DD");
    let startDate = today < firstDayOfYear?firstDayOfYear:today;
    let endDate = moment(startDate).add('8', 'weeks');
    this.set('startDate', startDate.toDate());
    this.set('endDate', endDate.toDate());
  },
  requiredPublicationSetFields: ['startDate', 'endDate'],
  requiredPublicationLengthFields: ['cohorts'],
  optionalPublicationSetFields: [],
  optionalPublicationLengthFields: ['terms', 'objectives', 'meshDescriptors'],
  requiredPublicationIssues: computed('startDate', 'endDate', 'cohorts.length', function(){
    return this.getRequiredPublicationIssues();
  }),
  optionalPublicationIssues: computed(
    'terms.length',
    'objectives.length',
    'meshDescriptors.length',
    function(){
      return this.getOptionalPublicationIssues();
    }
  ),

  /**
   * All schools associated with this course.
   * This includes the course-owning school, as well as schools owning associated cohorts.
   * @property schools
   * @type {Ember.computed}
   * @public
   */
  schools: computed('school', 'cohorts.[]', async function() {

    const courseOwningSchool = await this.get('school');

    const cohorts = await this.get('cohorts');
    const programYears = await all(cohorts.mapBy('programYear'));
    const programs = await all(programYears.mapBy('program'));
    const schools = await all(programs.mapBy('school'));

    schools.pushObject(courseOwningSchool);
    return schools.uniq();
  }),

  /**
   * All vocabularies that are eligible for assignment to this course.
   * @property assignableVocabularies
   * @type {Ember.computed}
   * @public
   */
  assignableVocabularies: computed('schools.@each.vocabularies', async function() {
    const schools = await this.get('schools');
    const vocabularies = await all(schools.mapBy('vocabularies'));
    return vocabularies.reduce((array, set) => {
      array.pushObjects(set.toArray());
      return array;
    }, []).sortBy('school.title', 'title');
  }),

  /**
   * A list of course objectives, sorted by position and title.
   * @property sortedObjectives
   * @type {Ember.computed}
   */
  sortedObjectives: computed('objectives.@each.position', 'objectives.@each.title', async function() {
      const objectives = await this.get('objectives');
      return objectives.toArray().sort(this.positionSortingCallback);
  }),

  hasMultipleCohorts: computed('cohorts.[]', function(){
    const meta = this.hasMany('cohorts');
    const ids = meta.ids();

    return ids.length > 1;
  }),
});
