import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, find, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Integration | Component | session copy', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  test('it renders', async function (assert) {
    const now = moment();
    const thisYear = now.year();
    const lastYear = thisYear - 1;
    const nextYear = thisYear + 1;

    [lastYear, thisYear, nextYear].forEach((year) => {
      this.server.create('academic-year', {
        id: year,
      });
    });
    const school = this.server.create('school');
    const course = this.server.create('course', {
      title: 'old course 1',
      year: lastYear,
      school,
    });

    const course2 = this.server.create('course', {
      title: 'old course 2',
      year: lastYear,
      school,
    });

    const session = this.server.create('session', {
      title: 'old session',
      course,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);

    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);

    await render(hbs`<SessionCopy @session={{this.session}} />`);

    const yearSelect = '.year-select select';
    const courseSelect = '.course-select select';
    const save = '.done';

    assert.dom(`${yearSelect} option`).exists({ count: 3 });
    for (let i = 1; i <= 2; i++) {
      assert
        .dom(`${yearSelect} option:nth-of-type(${i})`)
        .hasText(`${lastYear + i - 1} - ${lastYear + i}`);
    }
    assert.dom(`${courseSelect} option`).exists({ count: 2 });
    assert.dom(`${courseSelect} option:nth-of-type(1)`).hasText(course.title);
    assert.dom(`${courseSelect} option:nth-of-type(2)`).hasText(course2.title);
    assert.notOk(find(save).enabled);
  });

  test('copy session', async function (assert) {
    assert.expect(22);

    const thisYear = parseInt(moment().format('YYYY'), 10);
    this.server.create('academic-year', {
      id: thisYear,
    });

    const school = this.server.create('school');
    const course = this.server.create('course', {
      title: 'old course',
      year: thisYear,
      school,
    });
    const learningMaterial = this.server.create('learning-material');
    const sessionLearningMaterial = this.server.create('session-learning-material', {
      notes: 'some notes',
      required: false,
      publicNotes: true,
      learningMaterial,
      position: 3,
    });
    const meshDescriptor = this.server.create('mesh-descriptor');
    const term = this.server.create('term');
    const sessionType = this.server.create('session-type');

    const session = this.server.create('session', {
      title: 'old session',
      description: 'test description',
      course,
      attireRequired: true,
      equipmentRequired: false,
      supplemental: true,
      attendanceRequired: true,
      instructionalNotes: 'old session notes',
      sessionType,
      meshDescriptors: [meshDescriptor],
      terms: [term],
      learningMaterials: [sessionLearningMaterial],
    });

    const courseObjective = this.server.create('courseObjective');
    const objectiveTerm = this.server.create('term');
    const sessionObjective = this.server.create('sessionObjective', {
      session,
      title: 'session objective title',
      courseObjectives: [courseObjective],
      terms: [objectiveTerm],
      position: 3,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    this.set('visit', (newSession) => {
      assert.equal(newSession.id, 2);
    });
    await render(hbs`<SessionCopy @session={{this.session}} @visit={{this.visit}} />`);

    await click('.done');

    const sessions = await this.owner.lookup('service:store').findAll('session');
    assert.equal(sessions.length, 2);
    const newSession = sessions.findBy('id', '2');
    assert.equal(session.attireRequired, newSession.attireRequired);
    assert.equal(session.equipmentRequired, newSession.equipmentRequired);
    assert.equal(session.supplemental, newSession.supplemental);
    assert.equal(session.attendanceRequired, newSession.attendanceRequired);
    assert.equal(session.title, newSession.title);
    assert.equal(session.description, newSession.description);
    assert.equal(session.instructionalNotes, newSession.instructionalNotes);

    const sessionLearningMaterials = await this.owner
      .lookup('service:store')
      .findAll('session-learning-material');
    assert.equal(sessionLearningMaterials.length, 2);
    const newSessionLm = sessionLearningMaterials.findBy('id', '2');
    assert.equal(sessionLearningMaterial.notes, newSessionLm.notes);
    assert.equal(sessionLearningMaterial.required, newSessionLm.required);
    assert.equal(sessionLearningMaterial.publicNotes, newSessionLm.publicNotes);
    assert.equal(sessionLearningMaterial.position, newSessionLm.position);
    assert.equal(newSessionLm.belongsTo('session').id(), newSession.id);
    assert.equal(newSessionLm.belongsTo('learningMaterial').id(), learningMaterial.id);

    const sessionObjectives = await this.owner.lookup('service:store').findAll('session-objective');
    assert.equal(sessionObjectives.length, 2);
    const newSessionObjective = sessionObjectives.findBy('id', '2');
    assert.equal(newSessionObjective.title, sessionObjective.title);
    assert.equal(sessionObjective.position, newSessionObjective.position);
    assert.equal(newSessionObjective.belongsTo('session').id(), newSession.id);
    const objectiveTermModel = await this.owner
      .lookup('service:store')
      .find('term', objectiveTerm.id);
    const copiedSessionObjectiveTerms = await newSessionObjective.terms;
    assert.equal(copiedSessionObjectiveTerms.length, 1);
    assert.ok(copiedSessionObjectiveTerms.includes(objectiveTermModel));
  });

  test('save cannot be clicked when there is no year or course', async function (assert) {
    const school = this.server.create('school');
    const course = this.server.create('course', {
      school,
    });
    const sessionType = this.server.create('session-type');

    const session = this.server.create('session', {
      course,
      attireRequired: true,
      equipmentRequired: false,
      supplemental: true,
      attendanceRequired: true,
      sessionType,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);

    await render(hbs`<SessionCopy @session={{this.session}} />`);
    assert.dom('[data-test-save]').isDisabled();
  });

  test('changing the year looks for new matching courses', async function (assert) {
    assert.expect(5);
    const thisYear = parseInt(moment().format('YYYY'), 10);
    const nextYear = thisYear + 1;
    this.server.create('academic-year', {
      id: thisYear,
    });
    this.server.create('academic-year', {
      id: nextYear,
    });

    const school = this.server.create('school');
    const course1 = this.server.create('course', {
      school,
      year: thisYear,
    });
    const course2 = this.server.create('course', {
      school,
      year: nextYear,
    });

    const sessionType = this.server.create('session-type');

    const session = this.server.create('session', {
      course: course1,
      attireRequired: true,
      equipmentRequired: false,
      supplemental: true,
      attendanceRequired: true,
      sessionType,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    await render(hbs`<SessionCopy @session={{this.session}} />`);
    const yearSelect = '.year-select select';
    const courseSelect = '.course-select select';

    assert.dom(yearSelect).hasValue(`${thisYear}`);
    assert.dom(`${courseSelect} option`).exists({ count: 1 });
    assert.dom(`${courseSelect} option:nth-of-type(1)`).hasText(course1.title);

    await fillIn(yearSelect, nextYear);
    assert.dom(`${courseSelect} option`).exists({ count: 1 });
    assert.dom(`${courseSelect} option:nth-of-type(1)`).hasText(course2.title);
  });

  test('copy session into the first course in a different year #2130', async function (assert) {
    assert.expect(4);
    const thisYear = parseInt(moment().format('YYYY'), 10);
    const nextYear = thisYear + 1;
    this.server.create('academic-year', {
      id: thisYear,
    });
    this.server.create('academic-year', {
      id: nextYear,
    });

    const school = this.server.create('school');
    const course = this.server.create('course', {
      school,
      year: thisYear,
    });
    this.server.create('course', {
      school,
      year: nextYear,
    });
    const course3 = this.server.create('course', {
      school,
      title: 'alpha first',
      year: nextYear,
    });

    const sessionType = this.server.create('session-type');

    const session = this.server.create('session', {
      course,
      attireRequired: true,
      equipmentRequired: false,
      supplemental: true,
      attendanceRequired: true,
      sessionType,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    this.set('visit', (newSession) => {
      assert.equal(newSession.id, 2);
    });

    await render(hbs`<SessionCopy @session={{this.session}} @visit={{this.visit}} />`);
    const yearSelect = '.year-select select';
    const courseSelect = '.course-select select';

    await fillIn(yearSelect, nextYear);
    assert.dom(courseSelect).hasValue(course3.id, 'first course is selected');
    await click('.done');

    const sessions = await this.owner.lookup('service:store').findAll('session');
    assert.equal(sessions.length, 2);
    const newSession = sessions.findBy('id', '2');
    assert.equal(newSession.belongsTo('course').id(), course3.id);
  });

  test('copy session into same course saves postrequisites', async function (assert) {
    assert.expect(4);

    const thisYear = parseInt(moment().format('YYYY'), 10);
    this.server.create('academic-year', {
      id: thisYear,
    });

    const school = this.server.create('school');
    const course = this.server.create('course', {
      year: thisYear,
      school,
    });

    const sessionType = this.server.create('session-type');

    const postrequisite = this.server.create('session', {
      course,
      sessionType,
    });

    const session = this.server.create('session', {
      course,
      sessionType,
      postrequisite,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    this.set('visit', (newSession) => {
      assert.equal(newSession.id, 3);
    });

    await render(hbs`<SessionCopy @session={{this.session}} @visit={{this.visit}} />`);

    await click('.done');

    const sessions = await this.owner.lookup('service:store').findAll('session');
    assert.equal(sessions.length, 3);
    const newSession = sessions.findBy('id', '3');
    assert.equal(session.title, newSession.title);

    const newPostRequisite = await newSession.postrequisite;
    assert.equal(postrequisite.id, newPostRequisite.id);
  });

  test('copy session into different course does not save postrequisites', async function (assert) {
    assert.expect(4);

    const thisYear = parseInt(moment().format('YYYY'), 10);
    this.server.create('academic-year', {
      id: thisYear,
    });

    const school = this.server.create('school');
    const course = this.server.create('course', {
      year: thisYear,
      school,
    });
    const secondCourse = this.server.create('course', {
      year: thisYear,
      school,
    });

    const sessionType = this.server.create('session-type');

    const postrequisite = this.server.create('session', {
      course,
      sessionType,
    });

    const session = this.server.create('session', {
      course,
      sessionType,
      postrequisite,
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    this.set('visit', (newSession) => {
      assert.equal(newSession.id, 3);
    });

    await render(hbs`<SessionCopy @session={{this.session}} @visit={{this.visit}} />`);
    const courseSelect = '.course-select select';
    await fillIn(courseSelect, secondCourse.id);
    await click('.done');

    const sessions = await this.owner.lookup('service:store').findAll('session');
    assert.equal(sessions.length, 3);
    const newSession = sessions.findBy('id', '3');
    assert.equal(session.title, newSession.title);

    const newPostRequisite = await newSession.postrequisite;
    assert.equal(newPostRequisite, null);
  });

  test('copy session into same course saves prerequisites', async function (assert) {
    assert.expect(6);

    const thisYear = parseInt(moment().format('YYYY'), 10);
    this.server.create('academic-year', {
      id: thisYear,
    });

    const school = this.server.create('school');
    const course = this.server.create('course', {
      year: thisYear,
      school,
    });

    const sessionType = this.server.create('session-type');

    const firstPrerequisite = this.server.create('session', {
      course,
      sessionType,
    });
    const secondPrerequisite = this.server.create('session', {
      course,
      sessionType,
    });

    const session = this.server.create('session', {
      course,
      sessionType,
      prerequisites: [firstPrerequisite, secondPrerequisite],
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    this.set('visit', (newSession) => {
      assert.equal(newSession.id, 4);
    });

    await render(hbs`<SessionCopy @session={{this.session}} @visit={{this.visit}} />`);

    await click('.done');

    const sessions = await this.owner.lookup('service:store').findAll('session');
    assert.equal(sessions.length, 4);
    const newSession = sessions.findBy('id', '4');
    assert.equal(session.title, newSession.title);

    const newPostRequisites = await newSession.prerequisites;
    const ids = newPostRequisites.mapBy('id');
    assert.equal(ids.length, 2);
    assert.ok(ids.includes(firstPrerequisite.id));
    assert.ok(ids.includes(secondPrerequisite.id));
  });

  test('copy session into different course does not save prerequisites', async function (assert) {
    assert.expect(4);

    const thisYear = parseInt(moment().format('YYYY'), 10);
    this.server.create('academic-year', {
      id: thisYear,
    });

    const school = this.server.create('school');
    const course = this.server.create('course', {
      year: thisYear,
      school,
    });
    const secondCourse = this.server.create('course', {
      year: thisYear,
      school,
    });

    const sessionType = this.server.create('session-type');

    const firstPrerequisite = this.server.create('session', {
      course,
      sessionType,
    });
    const secondPrerequisite = this.server.create('session', {
      course,
      sessionType,
    });

    const session = this.server.create('session', {
      course,
      sessionType,
      prerequisites: [firstPrerequisite, secondPrerequisite],
    });

    const permissionCheckerMock = Service.extend({
      canCreateSession() {
        return true;
      },
    });
    this.owner.register('service:permissionChecker', permissionCheckerMock);
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    this.set('session', sessionModel);
    this.set('visit', (newSession) => {
      assert.equal(newSession.id, 4);
    });

    await render(hbs`<SessionCopy @session={{this.session}} @visit={{this.visit}} />`);

    const courseSelect = '.course-select select';
    await fillIn(courseSelect, secondCourse.id);
    await click('.done');

    const sessions = await this.owner.lookup('service:store').findAll('session');
    assert.equal(sessions.length, 4);
    const newSession = sessions.findBy('id', '4');
    assert.equal(session.title, newSession.title);

    const newPostRequisites = await newSession.prerequisites;
    assert.equal(newPostRequisites.length, 0);
  });
});
