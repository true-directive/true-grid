// Copyright (C) 2018 Aleksey Melnikov
// This project is licensed under the terms of the MIT license.
// https://github.com/m-alx/yopsilon-mask

import { Internationalization } from '../src/internationalization/internationalization.class';
import { MaskSection, MaskResult } from '../src/mask/mask-section.class';
import { MaskValue } from '../src/mask/mask-value.class';
import { MaskSettings } from '../src/mask/mask-settings.class';
import { Mask } from '../src/mask/mask.class';
import { Keys } from '../src/common/keys.class';


describe(`Applying mask to incomplete value. Pattern mm/dd/yyyy, value 12/12/19__: `, () => {
  let intl = new Internationalization();
  let s = new MaskSettings('_', true);
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.settings = s;
  mask.pattern = 'mm/dd/yyyy';

  let res = mask.applyMask('12/12/19__');
  it(`Result must be 12/12/2019`, () => expect(res).toBe('12/12/2019'));
});

describe(`Applying mask to incomplete value. Pattern mm/dd/yyyy, value 12/12/19__: `, () => {
  let intl = new Internationalization();
  let s = new MaskSettings('_', true);
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.settings = s;
  mask.pattern = 'mm/dd/yyyy';

  let res = mask.applyMask('12/12/19__');
  it(`Result must be 12/12/2019`, () => expect(res).toBe('12/12/2019'));
});

describe(`Applying mask to value with placeholders. Pattern b.b.b.b, value 127.0.0.  1 `, () => {
  let intl = new Internationalization();
  let s = new MaskSettings(' ', true);
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.settings = s;
  mask.pattern = 'b.b.b.b';

  let res = mask.applyMask('127.0.0.  1');
  it(`Result must be 127.0.0.1`, () => expect(res).toBe('127.0.0.1'));
});

describe(`Applying mask to value with placeholders. Pattern +1 NNN NNN-NN-NN, value +1 ___ ___-__-__ `, () => {
  let intl = new Internationalization();
  let s = new MaskSettings('_', true);
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.settings = s;
  mask.pattern = '+1 NNN NNN-NN-NN';

  let res = mask.applyMask('+1 ___ ___-__-__');
  it(`Result must be empty`, () => expect(res).toBe(''));
});


describe(`Applying mask to incomplete value. Pattern b.b.b.b, value 127.`, () => {
  let intl = new Internationalization();
  let s = new MaskSettings(' ', true);
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.settings = s;
  mask.pattern = 'b.b.b.b';

  let res = mask.applyMask('127.');
  it(`Result must be 127.0.0.1`, () => expect(res).toBe(''));
});

describe(`Нажатие [ArrowRight] с selLength=0 при значении [13.12.2018] перед [018]: `, () => {
  let res: MaskResult;

  //beforeEach(async(() => {
    let intl = new Internationalization();
    const mask = new Mask();
    mask.setLocale(intl.locales[0]);
    mask.pattern = 'mm/dd/yyyy';
    res = mask.applyKeyAtPos('12/12/2018', Keys.RIGHT, '', 7, 7);
  //}));

  it(`Положение курсора должно остаться 7`, () => expect(res.selStart).toBe(7));
  it(`SelLength должна стать 1`, () => expect(res.selLength).toBe(1));
});

describe(`AppendPlaceholders = false. Шаблон [dd mmm yyyy]. Нажимаем [ArrowRight] с selStart=2 при значении [11]: `, () => {
  let res: MaskResult;

  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  let s = new MaskSettings('_', true)
  s.appendPlaceholders = false;
  mask.settings = s;
  mask.pattern = 'dd mmm yyyy';
  res = mask.applyKeyAtPos('11', Keys.RIGHT, '', 2, 0);

  it(`Новое значение маски 11 jan`, () => expect(res.newValue).toBe('11 jan'));
  it(`Положение курсора должно быть 3`, () => expect(res.selStart).toBe(3));
  it(`SelLength должна быть 1`, () => expect(res.selLength).toBe(1));
});

describe(`Опция AppendPlaceholders=true: `, () => {
  let res: MaskResult;
  let s = new MaskSettings('_', true);
  s.appendPlaceholders = true;
  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.pattern = 'mm/dd/yyyy';
  mask.settings = s;
  res = mask.applyKeyAtPos('', 0, '1', 0, 0);

  it(`Маска mm/dd/yyyy. Нажимаем 1 при пустой строке. Новое значение должно быть 1_/__/____`, () => expect(res.newValue).toBe('1_/__/____'));
});


describe(`Маска с переменной длиной секции (255.255.255.0): `, () => {
  let res: MaskResult;

  let s = new MaskSettings('_', true);
  s.appendPlaceholders = false;

  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.pattern = 'b.b.b.b';
  mask.settings = s;
  res = mask.applyKeyAtPos('255.255.255.0', Keys.BACKSPACE, '', 3, 0);

  it(`Бэкспэйсим последний символ первой секции. Должно быть 25.255.255.0`, () => expect(res.newValue).toBe('25.255.255.0'));
});

describe(`Символ разделителя в пустой секции должен игнорироваться: `, () => {
  let res: MaskResult;

  let s = new MaskSettings(' ', true);
  s.appendPlaceholders = false;

  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.pattern = 'b.b.b.b';
  mask.settings = s;
  res = mask.applyKeyAtPos('172. . . ', 0, '.', 4, 0);

  it(`Впечатываем точку. Должно остаться 172. . . `, () => expect(res.newValue).toBe('172. . . '));
  it(`Курсор должен остаться на месте`, () => expect(res.selStart).toBe(4));
});

describe(`Символ разделителя должен приниматься пустой секцией, если ни одна из секций не отвергла его: `, () => {
  let res: MaskResult;

  let s = new MaskSettings('_', true);
  s.appendPlaceholders = false;

  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.pattern = '+1 NNN NNN-NN-NN';
  mask.settings = s;
  res = mask.applyKeyAtPos('+', 0, '1', 1, 0);

  it(`С маской [+1 NNN NNN-NN-NN] впечатываем 1 после +.`, () => expect(res.newValue).toBe('+1'));

});

describe(`Соответствие строки маске:`, () => {

  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.pattern = 'dd.MM.yyyy';

  it(`Значение 13.12.1979 соответствует маске`, () => expect(mask.checkMask('13.12.1979')).toBeTruthy());
  it(`Значение 13.12.197 НЕ соответствует маске`, () => expect(mask.checkMask('13.12.197')).toBeFalsy());

  it(`Значение 13.AA.1979 НЕ соответствует маске`, () => expect(mask.checkMask('13.AA.1979')).toBeFalsy());
});

describe(`Соответствие строки маске 2:`, () => {

  //
  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  mask.pattern = '+7 NNN NNN-NN-NN';

  it(`NULL не соответствует маске`, () => expect(mask.checkMask(null)).toBeFalsy());
  it(`Пустая строка не соответствует маске`, () => expect(mask.checkMask('')).toBeFalsy());
  it(`Значение +7 921 911-00-00 соответствует маске`, () => expect(mask.checkMask('+7 921 911-00-00')).toBeTruthy());
});

describe(`Кастомная секция, regular expression`, () => {

  let intl = new Internationalization();
  const mask = new Mask();
  mask.setLocale(intl.locales[0]);
  let s = new MaskSettings('_', true);
  s.appendPlaceholders = false;

  s.sectionTypes.push(
    { selectors: ['A'], numeric: false, regExp: /[a-b]/i },
  );
  mask.settings = s;
  mask.pattern = 'ANNN';
  let res: MaskResult;

  it(`Первый символ A или B или C: символ D нелья применить`, () => expect(mask.applyKeyAtPos('', 0, 'D', 0, 0)).toBe(null));
  it(`Первый символ A или B или C: при нажатии A значение становится равным A `, () => expect(mask.applyKeyAtPos('', 0, 'A', 0, 0).newValue).toBe('A'));
});

describe(`Преобразование из одного шаблона в другой`, () => {

  let intl = new Internationalization();
  let mask1 = new Mask();
  let mask2 = new Mask();

  mask1.setLocale(intl.locales[0]);
  mask2.setLocale(intl.locales[0]);

  let s = new MaskSettings('_', true);
  s.appendPlaceholders = true;

  mask1.settings = s;
  mask2.settings = s;

  mask1.pattern = 'NNNN NNNN NNNN NNNN';
  mask2.pattern = 'NNN NNNNNN NNNNN';

  it(`Чистое значение старой маски`, () => expect(mask1.pureValue('34__ ____ ____ ____')).toBe('34'));
  it(`Значение для новой маски`, () => expect(mask2.applyPureValue('34')).toBe('34_ ______ _____'));

});
