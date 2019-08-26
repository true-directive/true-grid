// Copyright (C) 2018 Aleksey Melnikov
// This project is licensed under the terms of the MIT license.

import { Internationalization } from '../src/internationalization/internationalization.class';
import { MaskSection, MaskResult } from '../src/mask/mask-section.class';
import { MaskValue } from '../src/mask/mask-value.class';
import { Mask } from '../src/mask/mask.class';

import { DateParserFormatter } from '../src/dates/date-parser-formatter.class';

describe(`Format datetime by Mask (mask=MM/dd/yy h:mi tt, value=01/05/19 2:30 pm)`, () => {

  const intl = new Internationalization();
  const date = new Date(2019, 0, 5, 14, 30, 0);

  const pattern = 'MM/dd/yy h:mi tt';
  const mask = new Mask();
  mask.pattern = pattern;
  mask.setLocale(intl.locales[0]);
  let res = DateParserFormatter.format(date, mask);

  it(`Formatted value = 01/05/2019 2:30 pm`, () => expect(res).toBe('01/05/19 2:30 pm'));
});

describe(`Format datetime by Mask (mask = dd.MM.yyyy HH:mi:ss.fff, value = 01/05/2019 13:30:15.152)`, () => {

  const intl = new Internationalization();

  const date = new Date(2019, 0, 5, 13, 30, 15, 152);

  const pattern = 'dd.MM.yyyy HH:mi:ss.fff';
  const mask = new Mask();
  mask.pattern = pattern;
  mask.setLocale(intl.locales[0]);
  const res = DateParserFormatter.format(date, mask);

  it(`Formatted value = 05.01.2019 13:30:15.152`, () => expect(res).toBe('05.01.2019 13:30:15.152'));
});


describe(`Parse datetime by Mask (mask=MM/dd/yy h:mi tt, value=01/05/19 1:30 pm)`, () => {

  const intl = new Internationalization();

  const dateString = '01/05/19 1:30 pm';

  const pattern = 'MM/dd/yy h:mi tt';
  const mask = new Mask();
  mask.pattern = pattern;
  mask.setLocale(intl.locales[0]);
  let res = DateParserFormatter.parse(dateString, mask); // MaskDate.parseDate(mask.sections, dateString);

  it(`Month = 0`, () => expect(res.getMonth()).toBe(0));
  it(`Day = 5`, () => expect(res.getDate()).toBe(5));
  it(`Year = 2019`, () => expect(res.getFullYear()).toBe(2019));
  it(`Hours = 13`, () => expect(res.getHours()).toBe(13));
  it(`Minutes = 30`, () => expect(res.getMinutes()).toBe(30));
});

describe(`Parse datetime by Mask (mask=dd mmm yyyy, value=12 dec 2018)`, () => {

  const intl = new Internationalization();

  const dateString = '12 dec 2018';

  const pattern = 'dd mmm yyyy';
  const mask = new Mask();
  mask.pattern = pattern;
  mask.setLocale(intl.locales[0]);
  let res = DateParserFormatter.parse(dateString, mask); // MaskDate.parseDate(mask.sections, dateString);

  it(`Month = 11`, () => expect(res.getMonth()).toBe(11));
  it(`Day = 12`, () => expect(res.getDate()).toBe(12));
  it(`Year = 2018`, () => expect(res.getFullYear()).toBe(2018));
});


describe(`Parse not matched date (mask=MM/dd/yy h:mi tt, value=01/05/19 1:30)`, () => {

  const intl = new Internationalization();

  const dateString = '01/05/19 1:30';

  const pattern = 'MM/dd/yy h:mi tt';
  const mask = new Mask();
  mask.pattern = pattern;
  mask.setLocale(intl.locales[0]);
  let res = DateParserFormatter.parse(dateString, mask); // MaskDate.parseDate(mask.sections, dateString);

  it(`Result must be Invalid Date`, () => expect(res.getTime()).toBeNaN());
});

describe(`Parse invalid date (mask=MM/dd/yy, value=02/31/19)`, () => {

  const intl = new Internationalization();

  const dateString = '02/31/19';

  const pattern = 'MM/dd/yy';
  const mask = new Mask();
  mask.pattern = pattern;
  mask.setLocale(intl.locales[0]);
  const res = DateParserFormatter.parse(dateString, mask); // MaskDate.parseDate(mask.sections, dateString);

  it(`Result must be Invalid Date`, () => expect(res.getTime()).toBeNaN());
});
