import {
  module,
  test
} from 'qunit';
import { setupAuthentication } from 'ilios-common';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import page from 'ilios-common/page-objects/course';

module('Acceptance | Course with multiple Cohorts - Objective Parents', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  hooks.beforeEach(async function () {
    this.user = await setupAuthentication();
    this.school = this.server.create('school');
    const program = this.server.create('program', { school: this.school });

    const programYears = this.server.createList('programYear', 2, { program });
    const cohort1 = this.server.create('cohort', { programYear: programYears[0]});
    const cohort2 = this.server.create('cohort', { programYear: programYears[1]});
    const competencies = this.server.createList('competency', 2, { school: this.school, programYears });

    const objective1 = this.server.create('objective', { competency: competencies[0] });
    const objective2 = this.server.create('objective', { competency: competencies[1] });
    const objective3 = this.server.create('objective', { competency: competencies[0] });
    const objective4 = this.server.create('objective', { competency: competencies[1] });
    this.server.create('program-year-objective', { programYear: programYears[0], objective: objective1 });
    this.server.create('program-year-objective', { programYear: programYears[0], objective: objective2 });
    this.server.create('program-year-objective', { programYear: programYears[1], objective: objective3 });
    this.server.create('program-year-objective', { programYear: programYears[1], objective: objective4 });

    const objective5 = this.server.create('objective', { parents: [objective1, objective4] });
    const objective6 = this.server.create('objective');
    const course = this.server.create('course', { year: 2013, school: this.school, cohorts: [cohort1, cohort2] });
    this.server.create('course-objective', { course, objective: objective5 });
    this.server.create('course-objective', { course, objective: objective6 });
  });

  test('list parent objectives by competency', async function (assert) {
    this.user.update({ administeredSchools: [this.school] });
    assert.expect(32);

    await page.visit({ courseId: 1, details: true, courseObjectiveDetails: true });
    assert.equal(page.objectives.objectiveList.objectives.length, 2);

    assert.equal(page.objectives.objectiveList.objectives[0].description.text, 'objective 4');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list.length, 2);
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[0].text, 'objective 0');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[1].text, 'objective 3');
    await page.objectives.objectiveList.objectives[0].parents.list[0].manage();
    const m = page.objectives.objectiveList.objectives[0].parentManager;

    await m.selectCohort(1);

    assert.equal(m.cohorts.length, 2);
    assert.equal(m.cohorts[0].title, 'program 0 cohort 0');
    assert.equal(m.cohorts[0].value, '1');
    assert.equal(m.cohorts[1].title, 'program 0 cohort 1');
    assert.equal(m.cohorts[1].value, '2');

    assert.equal(m.competencies.length, 2);
    assert.equal(m.competencies[0].title, 'competency 0');
    assert.ok(m.competencies[0].selected);
    assert.equal(m.competencies[0].objectives.length, 1);
    assert.equal(m.competencies[0].objectives[0].title, 'objective 0');
    assert.ok(m.competencies[0].objectives[0].selected);

    assert.equal(m.competencies[1].title, 'competency 1');
    assert.ok(m.competencies[1].notSelected);
    assert.equal(m.competencies[1].objectives.length, 1);
    assert.equal(m.competencies[1].objectives[0].title, 'objective 1');
    assert.ok(m.competencies[1].objectives[0].notSelected);

    await m.selectCohort(2);

    assert.equal(m.competencies.length, 2);
    assert.equal(m.competencies[0].title, 'competency 0');
    assert.ok(m.competencies[0].notSelected);
    assert.equal(m.competencies[0].objectives.length, 1);
    assert.equal(m.competencies[0].objectives[0].title, 'objective 2');
    assert.ok(m.competencies[0].objectives[0].notSelected);

    assert.equal(m.competencies[1].title, 'competency 1');
    assert.ok(m.competencies[1].selected);
    assert.equal(m.competencies[1].objectives.length, 1);
    assert.equal(m.competencies[1].objectives[0].title, 'objective 3');
    assert.ok(m.competencies[1].objectives[0].selected);
  });

  test('save changes', async function(assert) {
    this.user.update({ administeredSchools: [this.school] });
    assert.expect(12);
    await page.visit({ courseId: 1, details: true, courseObjectiveDetails: true });
    assert.equal(page.objectives.objectiveList.objectives[0].description.text, 'objective 4');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list.length, 2);
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[0].text, 'objective 0');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[1].text, 'objective 3');
    await page.objectives.objectiveList.objectives[0].parents.list[0].manage();
    const m = page.objectives.objectiveList.objectives[0].parentManager;

    await m.selectCohort(1);

    await m.competencies[1].objectives[0].add();
    assert.ok(m.competencies[0].objectives[0].notSelected);
    assert.ok(m.competencies[1].objectives[0].selected);
    await m.selectCohort(2);
    await m.competencies[0].objectives[0].add();
    assert.ok(m.competencies[0].objectives[0].selected);
    assert.ok(m.competencies[1].objectives[0].notSelected);

    await page.objectives.objectiveList.objectives[0].parents.save();

    assert.equal(page.objectives.objectiveList.objectives[0].description.text, 'objective 4');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list.length, 2);
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[0].text, 'objective 1');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[1].text, 'objective 2');

  });

  test('cancel changes', async function(assert) {
    this.user.update({ administeredSchools: [this.school] });
    assert.expect(12);
    await page.visit({ courseId: 1, details: true, courseObjectiveDetails: true });
    assert.equal(page.objectives.objectiveList.objectives[0].description.text, 'objective 4');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list.length, 2);
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[0].text, 'objective 0');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[1].text, 'objective 3');
    await page.objectives.objectiveList.objectives[0].parents.list[0].manage();
    const m = page.objectives.objectiveList.objectives[0].parentManager;


    await m.selectCohort(1);

    await m.competencies[1].objectives[0].add();
    assert.ok(m.competencies[0].objectives[0].notSelected);
    assert.ok(m.competencies[1].objectives[0].selected);
    await m.selectCohort(2);
    await m.competencies[0].objectives[0].add();
    assert.ok(m.competencies[0].objectives[0].selected);
    assert.ok(m.competencies[1].objectives[0].notSelected);

    await page.objectives.objectiveList.objectives[0].parents.cancel();

    assert.equal(page.objectives.objectiveList.objectives[0].description.text, 'objective 4');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list.length, 2);
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[0].text, 'objective 0');
    assert.equal(page.objectives.objectiveList.objectives[0].parents.list[1].text, 'objective 3');
  });
});
