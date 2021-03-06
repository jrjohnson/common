import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask } from 'ember-concurrency';
import { validatable, Length, BeforeDate, AfterDate } from 'ilios-common/decorators/validation';

@validatable
export default class CourseOverview extends Component {
  @service currentUser;
  @service intl;
  @service permissionChecker;
  @service router;
  @service store;

  universalLocator = 'ILIOS';

  @Length(2, 255) @tracked externalId = null;
  @BeforeDate('endDate', { granularity: 'day' }) @tracked startDate = null;
  @AfterDate('startDate', { granularity: 'day' }) @tracked endDate = null;
  @tracked level = null;
  @tracked levelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  @tracked clerkshipTypeId;
  @tracked clerkshipTypeOptions;
  @tracked canCreateCourseInSchool = false;
  @tracked school = null;

  @restartableTask
  *load() {
    this.clerkshipTypeOptions = yield this.store.peekAll('course-clerkship-type');
    this.externalId = this.args.course.externalId;
    this.startDate = this.args.course.startDate;
    this.endDate = this.args.course.endDate;
    this.level = this.args.course.level;
    this.school = yield this.args.course.school;
    this.clerkshipTypeId = this.args.course.belongsTo('clerkshipType').id();
    this.canCreateCourseInSchool = yield this.permissionChecker.canCreateCourse(this.school);
  }

  get selectedClerkshipType() {
    if (!this.clerkshipTypeId) {
      return null;
    }

    return this.clerkshipTypeOptions.findBy('id', this.clerkshipTypeId);
  }

  get showRollover() {
    if (this.router.currentRouteName === 'course.rollover') {
      return false;
    }

    return this.canCreateCourseInSchool;
  }

  get clerkshipTypeTitle() {
    if (!this.selectedClerkshipType) {
      return this.intl.t('general.notAClerkship');
    }

    return this.selectedClerkshipType.title;
  }
  @action
  async changeClerkshipType() {
    this.args.course.set('clerkshipType', this.selectedClerkshipType);
    return this.args.course.save();
  }

  @action
  setCourseClerkshipType(event) {
    let id = event.target.value;
    //convert the string 'null' to a real null
    if (id === 'null') {
      id = null;
    }
    this.clerkshipTypeId = id;
  }

  @restartableTask
  *revertClerkshipTypeChanges() {
    const clerkshipType = yield this.args.course.clerkshipType;
    if (clerkshipType) {
      this.clerkshipTypeId = clerkshipType.id;
    } else {
      this.clerkshipTypeId = null;
    }
  }

  @restartableTask
  *changeStartDate() {
    this.addErrorDisplayFor('startDate');
    const isValid = yield this.isValid('startDate');
    if (!isValid) {
      return false;
    }
    this.removeErrorDisplayFor('startDate');
    this.args.course.set('startDate', this.startDate);
    yield this.args.course.save();
    this.startDate = this.args.course.startDate;
  }

  @action
  revertStartDateChanges() {
    this.startDate = this.args.course.startDate;
  }

  @restartableTask
  *changeEndDate() {
    this.addErrorDisplayFor('endDate');
    const isValid = yield this.isValid('endDate');
    if (!isValid) {
      return false;
    }
    this.removeErrorDisplayFor('endDate');
    this.args.course.set('endDate', this.endDate);
    yield this.args.course.save();
    this.endDate = this.args.course.endDate;
  }

  @action
  revertEndDateChanges() {
    this.endDate = this.args.course.endDate;
  }

  @restartableTask
  *changeExternalId() {
    this.addErrorDisplayFor('externalId');
    const isValid = yield this.isValid('externalId');
    if (!isValid) {
      return false;
    }
    this.removeErrorDisplayFor('externalId');
    this.args.course.set('externalId', this.externalId);
    yield this.args.course.save();
    this.externalId = this.args.course.externalId;
  }

  @action
  revertExternalIdChanges() {
    this.externalId = this.args.course.externalId;
  }

  @action
  setLevel(event) {
    this.level = parseInt(event.target.value, 10);
  }

  @action
  async changeLevel() {
    this.args.course.set('level', this.level);
    return this.args.course.save();
  }

  @action
  revertLevelChanges() {
    this.level = this.args.course.level;
  }
}
