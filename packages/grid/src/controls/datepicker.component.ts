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

import { Keys } from '@true-directive/base';

/**
 * Datepicker component
 */
@Component({
  selector: 'true-datepicker',
  templateUrl: './datepicker.component.html',
  styles: [`
    :host {
      display: inline-block;
    }

    .true-datepicker__input {
      width: 100%;
      height: 100%;
    }

    input {
      box-sizing: border-box;
      width: 100%;
    }
  `],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true}]
  })
export class DatepickerComponent extends DropdownBaseComponent {

  @Input('pattern')
  pattern: string;

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

  getIcon(): string {
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
    protected _elementRef: ElementRef,
    protected _renderer: Renderer2) {
      super(_elementRef, _renderer);
  }
}
