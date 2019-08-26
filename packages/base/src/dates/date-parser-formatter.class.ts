/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Mask } from '../mask/mask.class';
import { MaskSection } from '../mask/mask-section.class';
import { MaskSectionType } from '../mask/mask-section-type.class';

import { Dates } from '../common/dates.class';

// Parse and format DateTime
export class DateParserFormatter {

  // Creating Invalid Date
  public static invalidDate() {
    return new Date('*');
  }

  public static daysInMonth (y: number, m: number): number {
    return new Date(y, m, 0).getDate();
  }

  public static parse(value: string, mask: Mask): any {

    if (value === '') {
      return null;
    }

    const res = value;
    let sectionPos = 0;

    let d = 1;
    let m = 1;
    let y = 1970;

    let hh = 0;
    let mi = 0;
    let ss = 0;
    let ms = 0;

    let tt = '';

    for (let i = 0; i < mask.sections.length; i++) {

      const incomplete = false;
      const section: MaskSection = mask.sections[i];
      const datePart = section.sectionType.datePart;

      if (datePart === null) {
        // Not datetime component
        continue;
      }

      const v = section.extract(res, sectionPos);
      sectionPos = v.nextSectionPos();

      // Get section value
      const s: string = v.section.value();

      let n: number;
      n = NaN;

      if (section.isNumeric()) {

        if (s.indexOf(mask.settings.placeholder) >= 0) { // Contains placeholders
          return DateParserFormatter.invalidDate();
        }

        n = section.numericValue(section.removePlaceholders(s));

        if (n < section.sectionType.min || n > section.sectionType.max) {
          return DateParserFormatter.invalidDate();
        }
      } else {
        if (section.hasOptions()) {
          n = section.sectionType.options.indexOf(s);
          if (n < 0) {
            return DateParserFormatter.invalidDate();
          }
          n++;
        }
      }

      if (isNaN(n)) {
        return DateParserFormatter.invalidDate();
      }

      // Time components...
      if (datePart === 'H') {
        hh = n;
      }

      if (datePart === 'h') {
        hh = n;
        if (hh === 12) {
          hh = 0;
        }
      }

      if (datePart === 'tt') {
        tt = s;
      }

      if (datePart === 'mi') {
        mi = n;
      }

      if (datePart === 'ss') {
        ss = n;
      }

      if (datePart === 'ms') {
        ms = n;
      }

      // Date components...
      if (datePart === 'd') {
        d = n;
      }

      if (datePart === 'm') {
        m = n;
      }

      if (datePart === 'yy') {
        y = n < 50 ? 2000 + n : 1900 + n;
      }

      if (datePart === 'yyyy') {
        if (n < 100 && incomplete) {
          y = n < 50 ? 2000 + n : 1900 + n;
        } else {
          y = n;
        }
      }
    }

    if (tt.toLowerCase() === 'pm') {
      hh += 12;
    }

    // We should check number of days in month
    const maxDays: number = DateParserFormatter.daysInMonth(y, m);
    if (d > maxDays) {
      return DateParserFormatter.invalidDate();
    }

    return new Date(y, m - 1, d, hh, mi, ss, ms);
  }

  public static format(date: any, mask: Mask): string {

    if (Dates.isEmpty(date)) {
      return '';
    }

    let res = '';
    for (let i = 0; i < mask.sections.length; i++) {

      const section: MaskSection = mask.sections[i];
      const datePart = section.sectionType.datePart;

      let n = NaN;

      if (datePart === 'yyyy') {
        n = date.getFullYear();
      }

      if (datePart === 'yy') {
        n = date.getFullYear();
        if ( n >= 2000) {
          n -= 2000;
        } else {
          n -= 1900;
        }
      }

      if (datePart === 'm') {
        n = date.getMonth() + 1;
      }

      if (datePart === 'd') {
        n = date.getDate();
      }

      if (datePart === 'H') {
        n = date.getHours();
      }

      if (datePart === 'h') {
        n = date.getHours();

        if (n === 0) {
          n = 12;
        } else {
          if (n > 12) {
            n -= 12;
          }
        }
      }

      if (datePart === 'mi') {
        n = date.getMinutes();
      }

      if (datePart === 'ss') {
        n = date.getSeconds();
      }

      if (datePart === 'ms') {
        n = date.getMilliseconds();
      }

      if (datePart === 'tt') {
        n = date.getHours() >= 12 ? 2 : 1;
      }

      let s = '';

      if (section.hasOptions()) {
        s = section.sectionType.options[n - 1];
      } else {
        s = section.autoCorrectVal(n + '');
      }

      res += s + section.delimiter;
    }

    return res;
  }
}
