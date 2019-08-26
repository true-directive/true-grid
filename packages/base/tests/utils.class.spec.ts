import { Utils } from '../src/common/utils.class';

describe(`Utils`, () => {
  const s = '<a>123</a>';
  const res = Utils.htmlToPlaintext(s);
  it(`htmlToPlaintext('<a>123</a>') must be 123`, () => expect(res).toBe('123'));

  const array = [1,2,3];
  Utils.moveArrayItem(array, 2, 1);
  it(`moveArrayItem([1,2,3], 2, 1). array[1] must be 3`, () => expect(array[1]).toBe(3));

  const node1 = {id: 1};
  const node2 = {id: 2, parentNode: node1};
  const node3 = {id: 3, parentNode: node2};
  const node4 = {id: 3, parentNode: node3};
  const node5 = {id: 3, parentNode: node1};

  it('node1 is ancestor of node5', () => expect(Utils.isAncestor(node1, node4)).toBeTruthy());
  it('node4 is not ancestor of node5', () => expect(Utils.isAncestor(node5, node4)).toBeFalsy());

});
