import { removeHtmlTags } from '../../../helpers/remove-html-tags';
import { module, test } from 'qunit';

module('Unit | Helper | remove html tags', function () {
  test('it removes the html tags from a string', function (assert) {
    const result = removeHtmlTags(['<p>Tags should</p><p> not show up</p>']);
    assert.equal(result, 'Tags should not show up');
  });
});
