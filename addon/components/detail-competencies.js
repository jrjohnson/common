import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask } from 'ember-concurrency-decorators';

export default class DetailCompetenciesComponent extends Component {
  @tracked competenciesRelationship;

  @restartableTask
  *load() {
    this.competenciesRelationship = yield this.args.course.competencies;
  }

  get competencyCount() {
    if (!this.competenciesRelationship) {
      return 0;
    }
    return this.competenciesRelationship.length;
  }

  get hasCompetencies() {
    return this.competencyCount > 0;
  }

  @action
  collapse() {
    if (this.hasCompetencies) {
      this.args.collapse();
    }
  }
}
