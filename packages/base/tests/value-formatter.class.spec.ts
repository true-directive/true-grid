import { ValueFormatter } from '../src/value-formatter.class';
import { Column } from '../src/column.class';
import { ColumnType } from '../src/enums';
import { Internationalization } from '../src/internationalization/internationalization.class';
import { Locale } from '../src/internationalization/locale.class';

describe(`ValueFormatter test`, () => {

  const col_num = new Column('num', 'num', 100, ColumnType.NUMBER, '', '{N1-4.2}');
  const col_num_pref = new Column('num1', 'num1', 100, ColumnType.NUMBER, '', '${N1-4.2}');
  const col_num_postfix = new Column('num2', 'num2', 100, ColumnType.NUMBER, '', '{N1-4.2} kg');
  const col_num_curr = new Column('num3', 'num3', 100, ColumnType.NUMBER, '', 'currency');
  const col_date = new Column('date', 'date', 100, ColumnType.DATETIME, '', 'date');
  const col_date2 = new Column('date2', 'date2', 100, ColumnType.DATETIME, '', 'dd mmm yy');

  const col_num_r = new Column('num4', 'num4', 100, ColumnType.NUMBER);
  col_num_r.displayField = 'numTxt';

  const row = { num: 123, numTxt: '123 km' };

  const vf = new ValueFormatter();
  const intl = new Internationalization();
  vf.setLocale(intl.locales[0]);

  const locale_pt: Locale = {
    name: 'Portuguese',
    shortName: 'pt-PT',
    shortMonthNames: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul',
                      'Ago', 'Set', 'Out', 'Nov', 'Dez'],

    longMonthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro',
                     'Dezembro'],

    shortDayNames:  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],

    longDayNames:   ['Domingo', 'Segunda', 'Terça', 'Quarta',
                     'Quinta', 'Sexta', 'Sábado'],

    firstDayOfWeek: 1,

    dateFormat: 'dd-mm-yyyy',
    timeHMFormat: 'HH:mi',
    timeHMSFormat: 'HH:mi:ss',
    dateTimeHMFormat: 'dd-mm-yyyy HH:mi',
    dateTimeHMSFormat: 'dd-mm-yyyy HH:mi:ss',

    separators: [',', '.'],
    currency: '{N1-12.2} €',
    translates: {}
  };

  intl.addLocale(locale_pt);

  const vf_pt = new ValueFormatter();
  vf_pt.setLocale(intl.locales[1]);

  it('Format result of 123 must be 123.00 ', () =>
    expect(vf.displayedValue(col_num, 123, row)).toBe('123.00')
  );

  it('Displayed value for null must be empty string', () =>
    expect(vf.displayedValue(col_num, null, row)).toBe('')
  );

  it('Format result of $1234.5 must be $1,234.50 ', () =>
    expect(vf.displayedValue(col_num_curr, 1234.5, row)).toBe('$1,234.50')
  );

  it('Format result of $1234.5 must be $1,234.50 ', () =>
    expect(vf.displayedValue(col_num_pref, 1234.5, row)).toBe('$1,234.50')
  );

  it('Format result of [1234.5] with postfix must be 1,234.50 kg ', () =>
    expect(vf.displayedValue(col_num_postfix, 1234.5, row)).toBe('1,234.50 kg')
  );

  const dt = new Date(2019, 0, 1);

  it('Format result of 2019-jan-1 must be 01/01/2019', () =>
    expect(vf.displayedValue(col_date, dt, row)).toBe('01/01/2019')
  );

  it('Format result of 2019-jan-1 with "dd mmm yy" must be 01 jan 19', () =>
    expect(vf.displayedValue(col_date2, dt, row)).toBe('01 jan 19')
  );

  it('Displayed value for 123 must be 123 km', () =>
    expect(vf.displayedValue(col_num_r, 123, row)).toBe('123 km')
  );

  it('Format result of 2019-jan-1 in portugal locale must be 01/01/2019', () =>
    expect(vf_pt.displayedValue(col_date, dt, row)).toBe('01-01-2019')
  );

  it('Format currency of 1234.5 in portugal locale must be 1.234,50 €', () =>
    expect(vf_pt.displayedValue(col_num_curr, 1234.5, row)).toBe('1.234,50 €')
  );

});
