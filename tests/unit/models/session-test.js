import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import moment from 'moment';

module('Unit | Model | Session', function (hooks) {
  setupTest(hooks);

  test('check required publication items', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    assert.equal(model.get('requiredPublicationIssues').length, 2);
    model.set('title', 'nothing');
    assert.equal(model.get('requiredPublicationIssues').length, 1);
    model.get('offerings').addObject(store.createRecord('offering'));
    assert.equal(model.get('requiredPublicationIssues').length, 0);
  });

  test('check required ILM publication items', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    model.set('title', 'nothing');
    assert.equal(model.get('requiredPublicationIssues').length, 1);
    const ilmSession = store.createRecord('ilmSession');
    model.set('ilmSession', ilmSession);
    assert.equal(model.get('requiredPublicationIssues').length, 1);
  });

  test('check optional publication items', function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('session');
    assert.equal(model.get('optionalPublicationIssues').length, 3);
    model.get('terms').addObject(store.createRecord('term'));
    assert.equal(model.get('optionalPublicationIssues').length, 2);
    store.createRecord('session-objective', { session: model });
    assert.equal(model.get('optionalPublicationIssues').length, 1);
    model.get('meshDescriptors').addObject(store.createRecord('meshDescriptor'));
    assert.equal(model.get('optionalPublicationIssues').length, 0);
  });

  test('check empty associatedOfferingLearnerGroups', async function (assert) {
    assert.expect(1);
    const session = this.owner.lookup('service:store').createRecord('session');
    const groups = await session.get('associatedOfferingLearnerGroups');
    assert.equal(groups.length, 0);
  });

  test('check first level associatedOfferingLearnerGroups', async function (assert) {
    assert.expect(4);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });

    session.get('offerings').pushObjects([offering1, offering2]);

    const groups = await session.get('associatedOfferingLearnerGroups');
    assert.equal(groups.length, 3);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
  });

  test('check multi level associatedOfferingLearnerGroups', async function (assert) {
    assert.expect(6);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const learnerGroup4 = store.createRecord('learner-group');
    const learnerGroup5 = store.createRecord('learner-group');
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup5],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });
    const offering3 = store.createRecord('offering', {
      learnerGroups: [learnerGroup4],
    });
    session.get('offerings').pushObjects([offering1, offering2, offering3]);

    const groups = await session.get('associatedOfferingLearnerGroups');
    assert.equal(groups.length, 5);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
    assert.ok(groups.includes(learnerGroup4));
    assert.ok(groups.includes(learnerGroup5));
  });

  test('check empty associatedIlmLearnerGroups', async function (assert) {
    assert.expect(1);
    const session = this.owner.lookup('service:store').createRecord('session');

    const groups = await session.get('associatedIlmLearnerGroups');
    assert.equal(groups.length, 0);
  });

  test('check associatedIlmLearnerGroups', async function (assert) {
    assert.expect(4);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const ilm = store.createRecord('ilm-session', {
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup3],
    });

    session.set('ilmSession', ilm);

    const groups = await session.get('associatedIlmLearnerGroups');
    assert.equal(groups.length, 3);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
  });

  test('check empty associatedLearnerGroups', async function (assert) {
    assert.expect(1);
    const session = this.owner.lookup('service:store').createRecord('session');
    const groups = await session.get('associatedLearnerGroups');
    assert.equal(groups.length, 0);
  });

  test('check associatedLearnerGroups', async function (assert) {
    assert.expect(6);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const learnerGroup4 = store.createRecord('learner-group');
    const learnerGroup5 = store.createRecord('learner-group');

    const ilm = store.createRecord('ilm-session', {
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup3, learnerGroup4],
    });
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup5],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });

    session.set('ilmSession', ilm);
    session.get('offerings').pushObjects([offering1, offering2]);

    const groups = await session.get('associatedLearnerGroups');
    assert.equal(groups.length, 5);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
    assert.ok(groups.includes(learnerGroup4));
    assert.ok(groups.includes(learnerGroup5));
  });

  test('check learner groups count', function (assert) {
    assert.expect(2);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });

    session.get('offerings').pushObjects([offering1, offering2]);

    assert.equal(session.get('learnerGroupCount'), 3);

    const learnerGroup4 = store.createRecord('learner-group');
    const offering3 = store.createRecord('offering', {
      learnerGroups: [learnerGroup4],
    });
    session.get('offerings').pushObject(offering3);
    const learnerGroup5 = store.createRecord('learner-group');
    offering1.get('learnerGroups').pushObject(learnerGroup5);

    assert.equal(session.get('learnerGroupCount'), 5);
  });

  test('isIndependentLearning', async function (assert) {
    assert.expect(2);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('session');
    assert.notOk(model.get('isIndependentLearning'));
    await store.createRecord('ilmSession', { id: 1, session: model });
    assert.ok(model.get('isIndependentLearning'));
  });

  test('associatedVocabularies', async function (assert) {
    assert.expect(3);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const vocab1 = store.createRecord('vocabulary', { title: 'Zeppelin' });
    const vocab2 = store.createRecord('vocabulary', { title: 'Aardvark' });
    const term1 = store.createRecord('term', { vocabulary: vocab1 });
    const term2 = store.createRecord('term', { vocabulary: vocab1 });
    const term3 = store.createRecord('term', { vocabulary: vocab2 });
    subject.get('terms').pushObjects([term1, term2, term3]);
    const vocabularies = await subject.get('associatedVocabularies');
    assert.equal(vocabularies.length, 2);
    assert.equal(vocabularies[0], vocab2);
    assert.equal(vocabularies[1], vocab1);
  });

  test('termsWithAllParents', async function (assert) {
    assert.expect(7);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const term1 = store.createRecord('term');
    const term2 = store.createRecord('term', { parent: term1 });
    const term3 = store.createRecord('term', { parent: term1 });
    const term4 = store.createRecord('term', { parent: term2 });
    const term5 = store.createRecord('term', { parent: term3 });
    const term6 = store.createRecord('term');
    subject.get('terms').pushObjects([term4, term5, term6]);
    const terms = await subject.get('termsWithAllParents');
    assert.equal(terms.length, 6);
    assert.ok(terms.includes(term1));
    assert.ok(terms.includes(term2));
    assert.ok(terms.includes(term3));
    assert.ok(terms.includes(term4));
    assert.ok(terms.includes(term5));
    assert.ok(terms.includes(term6));
  });

  test('termCount', function (assert) {
    assert.expect(2);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    assert.equal(subject.get('termCount'), 0);
    const term1 = store.createRecord('term');
    const term2 = store.createRecord('term');
    subject.get('terms').pushObjects([term1, term2]);
    assert.equal(subject.get('termCount'), 2);
  });

  test('sortedSessionObjectives', async function (assert) {
    assert.expect(5);
    const store = this.owner.lookup('service:store');
    const session = store.createRecord('session');
    const sessionObjective1 = store.createRecord('session-objective', {
      id: 1,
      position: 10,
      session,
    });
    const sessionObjective2 = store.createRecord('session-objective', {
      id: 2,
      position: 5,
      session,
    });
    const sessionObjective3 = store.createRecord('session-objective', {
      id: 3,
      position: 5,
      session,
    });
    const sessionObjective4 = store.createRecord('session-objective', {
      id: 4,
      position: 0,
      session,
    });
    const sortedObjectives = await session.get('sortedSessionObjectives');
    assert.equal(sortedObjectives.length, 4);
    assert.equal(sortedObjectives[0], sessionObjective4);
    assert.equal(sortedObjectives[1], sessionObjective3);
    assert.equal(sortedObjectives[2], sessionObjective2);
    assert.equal(sortedObjectives[3], sessionObjective1);
  });

  test('totalSumOfferingsDuration', async function (assert) {
    assert.expect(2);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    let total = await subject.get('totalSumOfferingsDuration');
    assert.equal(total, 0);

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
      endDate: moment('2017-01-02'),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00'),
      endDate: moment('2017-01-01 10:00:00'),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    total = await subject.get('totalSumOfferingsDuration');
    assert.equal(total, 24.5);
  });

  test('maxSingleOfferingDuration', async function (assert) {
    assert.expect(2);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    let max = await subject.get('maxSingleOfferingDuration');
    assert.equal(max, 0);

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
      endDate: moment('2017-01-02'),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00'),
      endDate: moment('2017-01-01 10:00:00'),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    max = await subject.get('maxSingleOfferingDuration');
    assert.equal(max, 24.0);
  });

  test('firstOfferingDate - no offerings, and no ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const firstDate = await subject.get('firstOfferingDate');
    assert.equal(firstDate, null);
  });

  test('firstOfferingDate - ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const ilm = store.createRecord('ilmSession', {
      dueDate: moment('2015-01-01'),
    });
    subject.set('ilmSession', ilm);
    const firstDate = await subject.get('firstOfferingDate');
    assert.equal(firstDate, ilm.get('dueDate'));
  });

  test('firstOfferingDate - offerings', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const offering1 = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
    });
    const offering2 = store.createRecord('offering', {
      startDate: moment('2016-01-01'),
    });
    subject.get('offerings').pushObjects([offering1, offering2]);
    const firstDate = await subject.get('firstOfferingDate');
    assert.equal(offering2.get('startDate'), firstDate);
  });

  test('sortedOfferingsByDate', async function (assert) {
    assert.expect(4);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const offering1 = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
    });
    const offering2 = store.createRecord('offering', {
      startDate: moment('2016-01-01'),
    });
    const offering3 = store.createRecord('offering', {
      startDate: moment('2015-01-01'),
    });
    const offeringWithNoStartDate = store.createRecord('offering');
    subject
      .get('offerings')
      .pushObjects([offering1, offering2, offering3, offeringWithNoStartDate]);
    const sortedDates = await subject.get('sortedOfferingsByDate');
    assert.equal(sortedDates.length, 3);
    assert.equal(sortedDates[0], offering3);
    assert.equal(sortedDates[1], offering2);
    assert.equal(sortedDates[2], offering1);
  });

  test('maxDuration with ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
      endDate: moment('2017-01-02').add(30, 'minutes'),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00'),
      endDate: moment('2017-01-01 10:00:00'),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    const ilmSession = store.createRecord('ilmSession', { hours: 2.1 });
    subject.set('ilmSession', ilmSession);

    const max = await subject.get('maxDuration');
    assert.equal(max, 26.6);
  });

  test('maxDuration without ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
      endDate: moment('2017-01-02'),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00'),
      endDate: moment('2017-01-01 10:00:00'),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);

    const max = await subject.get('maxDuration');
    assert.equal(max, 24.0);
  });

  test('maxDuration only ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const ilmSession = store.createRecord('ilmSession', { hours: 2 });
    subject.set('ilmSession', ilmSession);

    const max = await subject.get('maxDuration');
    assert.equal(max, 2.0);
  });

  test('totalSumDuration with ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
      endDate: moment('2017-01-02').add(30, 'minutes'),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00'),
      endDate: moment('2017-01-01 10:00:00'),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    const ilmSession = store.createRecord('ilmSession', { hours: 2.1 });
    subject.set('ilmSession', ilmSession);

    const max = await subject.get('totalSumDuration');
    assert.equal(max, 27.1);
  });

  test('totalSumDuration without ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01'),
      endDate: moment('2017-01-02'),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00'),
      endDate: moment('2017-01-01 10:00:00'),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);

    const max = await subject.get('totalSumDuration');
    assert.equal(max, 24.5);
  });

  test('totalSumDuration only ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const ilmSession = store.createRecord('ilmSession', { hours: 2 });
    subject.set('ilmSession', ilmSession);

    const max = await subject.get('totalSumDuration');
    assert.equal(max, 2.0);
  });

  test('allInstructors gets offerings data', async function (assert) {
    assert.expect(3);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const offering = store.createRecord('offering');
    const instructorGroup = store.createRecord('instructorGroup', {
      offerings: [offering],
    });
    const user1 = store.createRecord('user', {
      instructedOfferings: [offering],
    });
    const user2 = store.createRecord('user', {
      instructorGroups: [instructorGroup],
    });
    subject.set('offerings', [offering]);

    const allInstructors = await subject.get('allInstructors');
    assert.equal(allInstructors.length, 2);
    assert.ok(allInstructors.includes(user1));
    assert.ok(allInstructors.includes(user2));
  });

  test('allInstructors gets ilmSession data', async function (assert) {
    assert.expect(3);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const ilmSession = store.createRecord('ilmSession');
    const instructorGroup = store.createRecord('instructorGroup', {
      ilmSessions: [ilmSession],
    });
    const user1 = store.createRecord('user', {
      instructorIlmSessions: [ilmSession],
    });
    const user2 = store.createRecord('user', {
      instructorGroups: [instructorGroup],
    });
    subject.set('ilmSession', ilmSession);

    const allInstructors = await subject.get('allInstructors');
    assert.equal(allInstructors.length, 2);
    assert.ok(allInstructors.includes(user1));
    assert.ok(allInstructors.includes(user2));
  });

  test('text only empty description', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    assert.equal('', subject.textDescription);
  });
});
