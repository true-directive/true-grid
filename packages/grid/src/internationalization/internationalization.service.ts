/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { Internationalization } from '@true-directive/base';
import { Locale } from '@true-directive/base';

@Injectable()
export class InternationalizationService extends Internationalization {

  // On locale change event
  private _onLocaleChanged: BehaviorSubject<Locale> = new BehaviorSubject<Locale>(this.locale);
  public readonly onLocaleChanged: Observable<Locale> = this._onLocaleChanged.asObservable();

  protected localeChangedEvent(l: Locale) {
    this._onLocaleChanged.next(l);
  }
}
