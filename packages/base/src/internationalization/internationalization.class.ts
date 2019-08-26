/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Locale } from './locale.class';

export class Internationalization {

  // List of locales
  public locales: Array<Locale> = [];

  // Current locale
  public _currentLocaleName: string;

  // Событие изменения локализации. Должно быть определено в производных классах
  protected localeChangedEvent(locale: Locale): void { }

  public get currentLocaleName(): string {
    return this._currentLocaleName;
  }

  public set currentLocaleName(shortName: string) {
    this._currentLocaleName = shortName;
    this.localeChangedEvent(this.locale);
  }

  // Adding a locale
  public addLocale(locale: Locale) {
    if (!this.locales.find(l => l.shortName === locale.shortName)) {
      this.locales.push(locale);
    }
  }

  //
  public get locale(): Locale {
    const res = this.locales.find(l => l.shortName === this._currentLocaleName);
    if (!res) {
      return this.locales[0];
    } else {
      return res;
    }
  }

  public translate(s: string): string {
    const res = this.locale.translates[s];
    return res ? res : s;
  }

  constructor() {

    this.locales.push(
      {
        name: 'English',
        shortName: 'en-US',

        shortMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                          'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        longMonthNames:  ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November',
                          'December'],

        shortDayNames:   ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

        longDayNames:    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                          'Friday', 'Saturday'],

        firstDayOfWeek: 0,
        dateFormat: 'mm/dd/yyyy',
        timeHMFormat: 'hh:mi am',
        timeHMSFormat: 'hh:mi:ss am',
        dateTimeHMFormat: 'mm/dd/yyyy hh:mi am',
        dateTimeHMSFormat: 'mm/dd/yyyy hh:mi:ss am',

        separators: ['.', ','],
        currency: '${N1-12.2}',

        translates: {}
      }
    );

    this._currentLocaleName = this.locales[0].shortName;
  }
}
