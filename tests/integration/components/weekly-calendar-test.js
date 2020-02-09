import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import moment from 'moment';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Integration | Component | weekly-calendar', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  test('it renders', async function (assert) {
    const january9th2018 = moment('2019-01-09 08:00:00');
    this.server.createList('userevent', 2, {
      startDate: january9th2018.format(),
      endDate: january9th2018.clone().add(1, 'hour').format(),
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018);

    await render(hbs`<WeeklyCalendar
      @events={{this.events}}
      @date={{this.date}}
      @changeToDayView={{noop}}
    />`);


    await this.pauseTest();

    assert.equal(this.element.textContent.trim(), '');
  });
});
