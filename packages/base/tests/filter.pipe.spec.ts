import { ColumnType } from '../src/enums';
import { Column } from '../src/column.class';
import { ValueFormatter } from '../src/value-formatter.class';
import { Filter, FilterOperator } from '../src/filter.class';
import { FilterPipe } from '../src/data-transforms/filter.pipe';
import { Internationalization } from '../src/internationalization/internationalization.class';

describe(`FilterPipe`, () => {

  const items = [
    {id: 1, name: 'John', checked: true, num: 1},
    {id: 2, name: 'Piter', checked: false, num: 2},
    {id: 3, name: 'Maria', checked: true, num: 3},
    {id: 4, name: 'Donald', checked: false, num: 123}
  ];

  const columns = [
    new Column('name'),
    new Column('id', 'id', 100, ColumnType.NUMBER),
    new Column('checked', 'checked', 50, ColumnType.BOOLEAN),
    new Column('num', 'num', 100, ColumnType.NUMBER, '', '{N1-4.2} kg')
  ];

  const vf = new ValueFormatter();
  const intl = new Internationalization();
  vf.setLocale(intl.locales[0]);

  const filter = new Filter('name', FilterOperator.CONTAINS, 'a', vf);
  const filter_not_contains = new Filter('name', FilterOperator.NOT_CONTAINS, 'D');
  const filter_equals = new Filter('name', FilterOperator.CONTAINS, 'Maria');

  const filter_checked = new Filter('checked', FilterOperator.EQUALS, true);
  const filter_id = new Filter('id', FilterOperator.BETWEEN, 1, 3);
  const filter_id_nb = new Filter('id', FilterOperator.NOT_BETWEEN, 1, 3);

  const fp = new FilterPipe();

  it(`'John' not contains 'a'`, () => expect(fp.match(items[0], columns, [filter], '')).toBeFalsy());
  it(`'Maria' contains 'a'`, () => expect(fp.match(items[2], columns, [filter], '')).toBeTruthy());

  it(`Four rows in result [no filter]`, () => expect(fp.transform(items, columns, [], '', vf).length).toBe(4));

  it(`Two rows in result [name contains 'a']`, () => expect(fp.transform(items, columns, [filter], '', vf).length).toBe(2));
  it(`Two rows in result [name not contains 'D']`, () => expect(fp.transform(items, columns, [filter_not_contains], '', vf).length).toBe(3));
  it(`One row in result [name equals 'Maria']`, () => expect(fp.transform(items, columns, [filter_equals], '', vf).length).toBe(1));

  it(`Three rows in result [id between 1 and 3]`, () => expect(fp.transform(items, columns, [filter_id], '', vf).length).toBe(3));
  it(`One row in result [id not between 1 and 3]`, () => expect(fp.transform(items, columns, [filter_id_nb], '', vf).length).toBe(1));

  it(`One row in result [Two filters: name contains 'a' and id not between 1 and 3]`,
    () => expect(
      fp.transform(items, columns, [filter, filter_id], '', vf).length)
      .toBe(1));

  it(`Two rows in result [checked = true]`, () => expect(
    fp.transform(items, columns, [filter_checked], '', vf).length)
    .toBe(2)
  );

  it(`'Maria' in result [text filter = 'Ma']`, () => expect(
    fp.transform(items, columns, [], 'Ma', vf)[0].name)
    .toBe('Maria')
  );

  const filter_items = new Filter('name', FilterOperator.SET, null, null,
    ['John', 'Piter', 'Donald', 'NoName']
  );

  it(`Three items in result [set of items]`, () => expect(
    fp.transform(items, columns, [filter_items], '', vf).length)
    .toBe(3)
  );

  it(`Common filter with numeric [text filter = '123.00']`, () => expect(
    fp.transform(items, columns, [], '123.00', vf).length)
    .toBe(1)
  );

  it(`Common filter with numeric [text filter = '124.00']`, () => expect(
    fp.transform(items, columns, [], '124.00', vf).length)
    .toBe(0)
  );
});
