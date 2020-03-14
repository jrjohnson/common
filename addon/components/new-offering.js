import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  store: service(),
  classNames: ['new-offering'],
  session: null,
  courseStartDate: null,
  courseEndDate: null,
  smallGroupMode: true,

  @action
  save(startDate, endDate, room, learnerGroups, instructorGroups, instructors){
    const store = this.get('store');
    const session = this.get('session');
    const offering = store.createRecord('offering');
    offering.setProperties({startDate, endDate, room, learnerGroups, instructorGroups, instructors, session});

    return offering.save();
  }
});
