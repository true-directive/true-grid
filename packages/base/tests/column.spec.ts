import { ColumnType } from '../src/enums';
import { Column } from '../src/column.class';
import { Filter, FilterOperator } from '../src/filter.class';
import { SummaryType } from '../src/summary.class';

describe(`Column`, () => {
  const col = new Column('name');
  const col_cb = new Column('checked', 'Checked', 100, ColumnType.CHECKBOX);
  const col_txt = new Column('txt', 'Txt', 100, ColumnType.STRING);
  col_txt.setSummary(SummaryType.MIN);
  col_txt.setSummary(SummaryType.MIN);

  it(`col.isText must be true`, () =>
    expect(col.isText).
    toBeTruthy()
  );

  it(`col.isBoolean must be false`, () =>
    expect(col.isBoolean).
    toBeFalsy()
  );

  it(`col.canReorder must be true`, () =>
    expect(col.canReorder).
    toBeTruthy()
  );

  const filter = col.createFilter('a');

  it('Create filter: filterOperator must be [CONTAINS]', () =>
    expect(filter.operator).
    toBe(FilterOperator.CONTAINS)
  );

  it(`col_cb.isCheckbox must be true`, () =>
    expect(col_cb.isCheckbox).
    toBeTruthy()
  );

  it(`col_cb.canResize must be false`, () =>
    expect(col_cb.canResize).
    toBeFalsy()
  );

  // summaries
  it(`col_txt.setSummary(SummaryType.MIN)`, () =>
    expect(col_txt.summaries.length).
    toBe(1)
  );

  it(`col_txt.summaries[0].type == SummaryType.MIN`, () =>
    expect(col_txt.summaries[0].type).
    toBe(SummaryType.MIN)
  );

});
