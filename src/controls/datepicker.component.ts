/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, HostBinding, EventEmitter, Renderer2, ElementRef,
         ChangeDetectorRef,
         ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { PopupComponent } from './popup.component';
import { CalendarComponent } from './calendar.component';
import { DropdownBaseComponent } from './dropdown-base.component';

import { MaskDateDirective } from '../mask/mask-date.directive';
import { InternationalizationService } from '../internationalization/internationalization.service';

import { Mask } from '@true-directive/base';
import { Keys } from '@true-directive/base';

/**
 * Datepicker component
 */
@Component({
  selector: 'true-datepicker',
  templateUrl: './datepicker.component.html',
  /* removed:  :host { display: inline-block; } - invalid iOS render */
  styles: [`
    :host {
      padding: 0;
    }
    .true-datepicker__input {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
    }

    input {
      box-sizing: border-box;
      width: 100%;
      margin: 0;
    }
  `],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true}]
  })
export class DatepickerComponent extends DropdownBaseComponent {

  _pattern = '';

  @Input('pattern')
  get pattern(): string {
    return this._pattern;
  }

  set pattern(s: string) {
    this._pattern = s;
    this.checkPattern();
  }

  @Input('error')
  error: string;

  @Input('showError')
  showError: boolean = true;

  @Input('inputClass')
  inputClass: string = '';

  @ViewChild('calendar')
  calendar: CalendarComponent;

  @ViewChild('input')
  input: any;

  @ViewChild('input', { read: MaskDateDirective })
  maskDateDirective: MaskDateDirective;

  checkPattern() {

    let hasDateComponents = false;
    const mask: Mask = Mask.maskWithPattern(this.intl, this._pattern);

    mask.sections.forEach(section => {
      if (section.sectionType.datePart === 'd' ||
          section.sectionType.datePart === 'm' ||
          section.sectionType.datePart === 'y' ||
          section.sectionType.datePart === 'yy' ||
          section.sectionType.datePart === 'yyyy'
        ) {
        hasDateComponents = true;
      }
    });
    this.usePopup = hasDateComponents;
  }

  getIcon(): string {
    if (!this.usePopup) {
      return '';
    }
    return 'true-icon-calendar-empty';
  }

  dateClick(e: any) {
    this.popup.closePopup();
  }

  escape(e: any) {
    this.popup.closePopup();
  }

  // Overriding this method to send focus in the calendar
  focusPopup() {
    this.calendar.setFocus();
  }

  acceptKey(e: any) {
    this.maskDateDirective.keyDown(
      Keys.generateEvent(this.input.nativeElement, -1, Keys.keyChar(e), e.shiftKey, e.ctrlKey)
    );
  }

  constructor(
    protected intl: InternationalizationService,
    protected _elementRef: ElementRef,
    protected _renderer: Renderer2) {
      super(_elementRef, _renderer);
  }
}
