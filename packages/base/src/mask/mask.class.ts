/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Internationalization } from '../internationalization/internationalization.class';
import { Locale } from '../internationalization/locale.class';

import { MaskSectionValue } from './mask-section-value.class';
import { MaskSectionType } from './mask-section-type.class';
import { MaskSection, MaskResult, MaskSectionAction } from './mask-section.class';
import { MaskSettings } from './mask-settings.class';
import { Keys } from '../common/keys.class';

export class Mask {

  // Default settings of all masks
  public static readonly defaultSettings: MaskSettings = new MaskSettings('_');

  // Delimiters
  public static readonly delimiterChars: string = ` .,()/|-:+ '`;

  // Predefined section types
  public static readonly sectionTypes: MaskSectionType[] = [

    // Time components
    { selectors: ['HH'], numeric: true, min: 0, max: 23, datePart: 'H' },
    { selectors: ['h'], numeric: true, min: 1, max: 12, datePart: 'h' },
    { selectors: ['hh'], numeric: true, min: 1, max: 12, datePart: 'h' },
    { selectors: ['mi', 'MI'], numeric: true, min: 0, max: 59, datePart: 'mi' },
    { selectors: ['ss', 'SS'], numeric: true, min: 0, max: 59, datePart: 'ss' },
    { selectors: ['TT', 'AM', 'PM'], numeric: false, options: ['AM', 'PM'], datePart: 'tt' },
    { selectors: ['tt', 'am', 'pm'], numeric: false, options: ['am', 'pm'], datePart: 'tt' },
    { selectors: ['fff'], numeric: true, datePart: 'ms' }, // Milliseconds

    // Date components
    { selectors: ['d', 'dd', 'DD'], numeric: true, min: 1, max: 31, datePart: 'd' },
    { selectors: ['m', 'mm', 'MM'], numeric: true, min: 1, max: 12, datePart: 'm' },
    { selectors: ['mmm'], numeric: false, datePart: 'm' },
    { selectors: ['MMM'], numeric: false, datePart: 'm' },
    { selectors: ['yy', 'YY'], numeric: true, min: 0, max: 99, datePart: 'yy' },
    { selectors: ['yyyy', 'YYYY'], numeric: true, min: 0, max: 9999, datePart: 'yyyy' },

    // Byte (from 0 to 255) - for ip-address or network mask
    { selectors: ['b'], numeric: true, min: 0, max: 255 },

    // Plus/minus
    { selectors: ['~'], numeric: false, regExp: new RegExp('[-+]') },

    // Letter or digit
    { selectors: ['*'], numeric: false, regExp: new RegExp('[\d\w]') },

    // Letters
    { selectors: ['l', 'L'], numeric: false, regExp: new RegExp('\w') },

    // Digits
    { selectors: ['n', 'N'], numeric: false, regExp: new RegExp('\d') },

  ];

  // Settings
  private _settings: MaskSettings = null;

  public set settings(o: MaskSettings) {
    this._settings = o;
    this.sections.forEach(s => s.settings = o);
    this.updateMask();
  }

  // Settings by default

  public get settings() {
    return this._settings === null ? Mask.defaultSettings : this._settings;
  }

  private readonly _separators: Array<string> = ['.', ','];

  // Sections with section chars
  private readonly _singles: string = '*aAnN#0';

  // Locale formats
  private localeDateFormat = '';
  private localeTimeHMFormat = '';
  private localeTimeHMSFormat = '';
  private localeDateTimeHMFormat = '';
  private localeDateTimeHMSFormat = '';

  // The list of sections
  public sections: Array<MaskSection> = [];

  // Pattern of mask
  private _pattern: string;
  public set pattern(v: string) {
    this._pattern = v;
    this.updateMask();
  }

  public get pattern(): string {
    return this._pattern;
  }

  // Определяем тип секции по шаблону
  public selectSectionType(s: string): MaskSectionType {
    //  First, look in the settings
    const res: MaskSectionType = this.settings.sectionTypes.find(i => (i.selectors.find(sel => sel === s) !== undefined));
    if (res !== undefined) {
      return res;
    }
    // Then, in predefined section types
    return Mask.sectionTypes.find(i => (i.selectors.find(sel => sel === s) !== undefined));
  }

  // Определяем, существуют ли типы секций, которые начинаются на заданный символ.
  private selectSectionTypeByFirstChar(char: string): MaskSectionType {
    //  First, look in the settings
    const res: MaskSectionType = this.settings.sectionTypes.find(i => (i.selectors.find(sel => sel[0] === char) !== null));
    if (res !== null) {
      return res;
    }
    // Then, in predefined section types
    return Mask.sectionTypes.find(i => (i.selectors.find(sel => sel[0] === char) !== null));
  }

  // Добавляет в список секций пустую секцию, имеющую разделитель
  private addEmptySection(delimiter: string) {
    this.sections.push(new MaskSection(this.settings, '', delimiter));
  }

  // Добавление секции в список
  private addSection(section: string, delimiter: string) {
    const sType = this.selectSectionType(section);

    if (!sType) {
      // Если секция не распознана - считаем это фиксированным текстом
      // и для каждого символа создаем пустую секцию с разделителем - этим
      // символом. Тогда маска будет принимать только их и переходить к
      // следующей секции
      for (let i = 0; i < section.length; i++) {
        this.addEmptySection(section[i]);
      }

      // Про разделители тоже нужно не забыть
      for (let i = 0; i < delimiter.length; i++) {
        this.addEmptySection(delimiter[i]);
      }
      return;
    }

    const s = new MaskSection(this.settings, section, delimiter, sType);
    // Так-то вообще, если разделитель длиннее одного символа,
    // нам нужно добавить пустые секции для всех символов кроме первого.
    // Но пока не будем здесь усложнять...
    s.delimiter = delimiter;
    this.sections.push(s);
  }

  // Получаем чистое значение без разделителей
  // Для преобразования из одного шаблона в другой.
  // Годится только для шаблонов, в котором все секции имеют фиксированную длину
  pureValue(value: string): string {

    if (value === null) {
      return value;
    }

    let sectionPos = 0;
    let res = '';
    this.sections.forEach(section => {
      const v = section.extract(value, sectionPos);
      res += section.removePlaceholders(v.section.value());
      sectionPos = v.nextSectionPos();
    });

    return res;
  }

  // Применяем чистое значение к шаблону и возвращаем форматированное значение
  applyPureValue(value: string): string {
    //
    if (value === null) {
      return value;
    }

    let res = '';
    let i = 0;
    this.sections.forEach(section => {
      const l = section.section.length;
      const s = value.substring(i, i + l);
      res += s;
      i += l;
      if (value.length >= i) {
        res += section.delimiter;
      }
    });

    if (this.settings.appendPlaceholders) {
      res = this.appendPlaceholders(res);
    }

    return res;
  }

  // Разбиваем строку маски на секции между разделителями
  updateMask(): void {

    this.sections = [];

    let s: string;

    // Выбор формата на по локализации
    switch (this._pattern) {

      case 'date': {
        s = this.localeDateFormat;
        break;
      }

      case 'time':
      case 'timeHM': {
        s = this.localeTimeHMFormat;
        break;
      }

      case 'timeHMS': {
        s = this.localeTimeHMSFormat;
        break;
      }

      case 'dateTime':
      case 'dateTimeHM': {
        s = this.localeDateTimeHMFormat;
        break;
      }

      case 'dateTimeHMS': {
        s = this.localeDateTimeHMSFormat;
        break;
      }

      default: s = this._pattern;
    }

    if (!s || s.length === 0) {
      return;
    }

    let i = 0;
    while (i < s.length) {

      const c = s[i];
      let sType = null;
      let part = '';

      if (this._singles.indexOf(c) >= 0) {
        part = c;
        sType = this.selectSectionType(c);
      } else {
        for (let j = s.length; j >= i; j--) {
          part = s.substring(i, j);
          sType = this.selectSectionType(part);
          if (sType) {
            break;
          }
        }
      }

      if (sType) {
        // Нужно добить разделителем
        i += part.length;
        let del = '';
        while (Mask.delimiterChars.indexOf(s[i]) >= 0) {
          del += s[i];
          i++;
        }

        if (del === '') {
          // Не найден разделитель
          if (i < s.length && this.selectSectionTypeByFirstChar(s[i]) === null) {
            // Если на текущий символ не найдется секции..
            // ..то это тоже разделитель
            del = s[i];
            i++;
          }
        }

        this.addSection(part, del);
        continue;
      }

      this.addSection('', c);
      i++;
    }
  }

  // Добавляем плэйсхолдеры к значению
  protected appendPlaceholders(value: string): string {

    let sectionStart = 0;
    let i = 0;
    while (i < this.sections.length) {
      const section = this.sections[i];
      const v = section.extract(value, sectionStart);

      while (v.section.length < section.length) {
        v.section.append(this.settings.placeholder);
      }

      v.delimiter = section.delimiter;

      // Обновляем значение и позицию следующей секции
      value = v.value();
      sectionStart = v.nextSectionPos();
      i++;
    }
    return value;
  }

  public checkMask(value: string): boolean {
    if (value === null) {
      return false;
    }
    if (value === '' && this.pattern !== '') {
      return false;
    }
    return this.applyMask(value) !== '';
  }

  // Форматирование строки по маске
  // Пустая строка будет означать инвалидность
  public applyMask(value: string, autoCorrect: boolean = true): string  {

    let sectionPos = 0;
    let res = value;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const v = section.extract(res, sectionPos);

      v.delimiter = section.delimiter;

      let sv = v.section.value();

      sv = section.removePlaceholders(sv);

      if (section.isNumeric()) {
        // Invalid number value
        const n = section.numericValue(sv);
        if (isNaN(n) || sv === '') {
          return '';
        }
      }

      if (sv.length < section.length) {
        if (section.sectionType && section.sectionType.datePart) {
          const dp = section.sectionType.datePart;
          if (dp === 'yyyy' && sv.length !== 2) {
            // For year we can accept value with 2 digits
            return '';
          }
          if (sv.length < 1) {
            // For others dateparts we can accept any not empty value
            return '';
          }
        } else {
          return '';
        }
      }

      if (autoCorrect) {
        sv = section.autoCorrectVal(sv);
      }

      res = v.update(sv, 0);
      sectionPos = v.nextSectionPos();
    }

    res = res.substring(0, sectionPos);
    return res;
  }

  // Применяем заданный символ к заданному значению в заданном месте
  public applyKeyAtPos(value: string, key: number, char: string, selStart: number, selEnd: number = 0): any {

    const selLength = selEnd - selStart;

    let sectionStart = 0;
    let section = null;
    let prev_section = null;
    let prev_sectionStart = 0;
    let acceptDelimiterChars = true;

    // Добавляем плэйсхолдеры перед обработкой. Чтобы обработчик мог их учитывать
    // при расчете следующей позиции курсора
    if (this.settings.appendPlaceholders) {
      value = this.appendPlaceholders(value);
    }

    for (let i = 0; i < this.sections.length; i++) {

      section = this.sections[i];

      // Обработка пользовательского действия
      const res: MaskResult = section.applyKey(value, key, char,
                                             sectionStart,
                                             selStart,
                                             selLength,
                                             acceptDelimiterChars,
                                             i === this.sections.length - 1);

      // Нельзя ничего применить
      if (res.action === MaskSectionAction.NONE) {
        return null;
      }

      if (this.settings.appendPlaceholders) {
        // Добавляем еще раз плэйсхолдеры
        res.newValue = this.appendPlaceholders(res.newValue);
      }

      if (res.action === MaskSectionAction.APPLY) {
        // Готово!
        return res;
      }

      if (res.action === MaskSectionAction.GO_BACK_AND_DELETE && prev_section !== null) {
        // Идем в конец предыдущей секции
        const selRes = prev_section.selectLast(res.newValue, prev_sectionStart, true);
        // И применяем Delete
        const delRes = prev_section.applyKey(selRes.newValue, Keys.DELETE, '', prev_sectionStart, selRes.selStart, selRes.selLength);
        return delRes;
      }

      if (res.action === MaskSectionAction.GO_BACK_AND_BACKSPACE && prev_section !== null) {
        // Идем в конец предыдущей секции
        const selRes = prev_section.selectLast(res.newValue, prev_sectionStart);
        // И тоже применяем Delete
        const delRes = prev_section.applyKey(selRes.newValue, Keys.DELETE, '', prev_sectionStart, selRes.selStart, selRes.selLength);
        return delRes;
      }

      if (res.action === MaskSectionAction.GO_BACK && prev_section !== null) {
        // Идем в конец предыдущей секции
        return prev_section.selectLast(res.newValue, prev_sectionStart);
      }

      // Идем в начало следующей секции
      if (res.action === MaskSectionAction.GO_FWD) {
        if (i < this.sections.length - 1) {
          const next_section = this.sections[i + 1];
          const valueWithDefaultVariant = next_section.setDefaultVariant(res.newValue, res.nextSectionPos);
          return next_section.selectFirst(valueWithDefaultVariant, res.nextSectionPos);
        } else {
          // Секция последняя. Скорректируем значение.
          return section.autoCorrect(res.newValue, sectionStart, res.selStart, res.selLength);
        }
      }

      // К этой секции ничего не применилось. Переходим к следующей секции..
      if (res.action === MaskSectionAction.SKIP) {

        // Запомним положение текущей секции и саму секцию для возврата по BACKSPACE
        // и стрелке влево
        if (section !== null && section.section !== '') {
          // Это условие для того, чтобы нельзя было вернуться на секции
          // без значащих символов
          prev_section = section;
          prev_sectionStart = sectionStart;
        }

        // Больше не будем принимать символы разделителей, т.к.
        // мы его отвергли в одной из предыдущей секций
        // Пример - +7 921 911 11 11 - в начале строки жмем 7, но + его не принял
        // Тогда это будет значащий символ уже
        if (section.section === '' && selStart < res.nextSectionPos) {
          acceptDelimiterChars = false;
        }

        // Даже если мы передали управление следующей секции, значение может
        // измениться - могут быть добавлены разделители или скорректированы значения
        value = res.newValue;
        selStart = res.selStart;
        sectionStart = res.nextSectionPos;

        continue;
      }

      // Значение кончилось...
      if (sectionStart > value.length) {
        return null;
      }
    }
    return null;
  }

  public setLocale(locale: Locale) {

    // Форматы
    this.localeDateFormat = locale.dateFormat;
    this.localeTimeHMFormat = locale.timeHMFormat;
    this.localeTimeHMSFormat = locale.timeHMSFormat;
    this.localeDateTimeHMFormat = locale.dateTimeHMFormat;
    this.localeDateTimeHMSFormat = locale.dateTimeHMSFormat;

    // Разделители
    this._separators[0] = locale.separators[0];
    this._separators[1] = locale.separators[1];

    // Устанавливаем короткие названия месяцев
    this.selectSectionType('mmm').options = locale.shortMonthNames.map(el => el.toLowerCase());
    this.selectSectionType('MMM').options = locale.shortMonthNames.map(el => el.toUpperCase());

    this.updateMask();
  }
}
