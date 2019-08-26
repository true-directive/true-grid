/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { ColumnType } from './enums';
import { Column } from './column.class';

import { Locale } from './internationalization/locale.class';
import { Mask } from './mask/mask.class';
import { NumberFormat } from './numbers/number-format.class';
import { NumberParserFormatter } from './numbers/number-parser-formatter.class';
import { DateParserFormatter } from './dates/date-parser-formatter.class';

/**
 * Форматирование числовых значений и дат/времени для вывода в гриде
 */
export class ValueFormatter {

  private _dateFormats: { [format: string]: Mask } = {};
  private _numberFormats: { [format: string]: NumberFormat } = {};

  private _locale: Locale;

  /**
   * Установка требуемой локализации, из которой будут взяты разделители чисел
   * и шаблоны дат/времени по умолчанию
   * @param  locale Локализация.
   */
  public setLocale(locale: Locale) {

    this._locale = locale;

    // this._separators[0] = locale.separators[0];
    // this._separators[1] = locale.separators[1];

    for (const fmt in this._dateFormats) {
      if (this._dateFormats.hasOwnProperty(fmt)) {
        this._dateFormats[fmt].setLocale(this._locale);
      }
    }
  }

  private getNumFormat(fmt: string): NumberFormat {
    fmt = fmt === '' ? '{1.2-10}' : fmt; // По умолчанию
    if (fmt === 'currency') {
      fmt = this._locale.currency;
    }
    if (!this._numberFormats[fmt]) {
      this._numberFormats[fmt] = NumberFormat.parseFormat(fmt);
    }
    return this._numberFormats[fmt];
  }

  private getDateFormat(fmt: string): Mask {
    if (!this._dateFormats[fmt]) {
      this._dateFormats[fmt] = new Mask();
      this._dateFormats[fmt].setLocale(this._locale);
      this._dateFormats[fmt].pattern = fmt;
    }
    return this._dateFormats[fmt];
  }

  public format(cType: ColumnType, format: string, value: any): string {

    if (format === '') {
      return value;
    }

    let res = '';

    if (cType === ColumnType.NUMBER) {
      const nf = this.getNumFormat(format);
      res = NumberParserFormatter.format(value, nf, this._locale.separators);
    }

    if (cType === ColumnType.DATETIME) {
      const m = this.getDateFormat(format);
      res = DateParserFormatter.format(value, m);
    }
    return res;
  }

  public displayedValue(c: Column, value: any, row: any): string {

    if (c.displayField !== '') {
      return row[c.displayField];
    }

    if (value === null || value === undefined) {
      return '';
    }

    if (!c || c.format === '') {
      return value;
    }

    return this.format(c.type, c.format, value);
  }
}
