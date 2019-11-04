/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Directive, ElementRef, Input, HostListener, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { MaskBaseDirective } from './mask-base.directive';
import { InternationalizationService } from '../internationalization/internationalization.service';

import { Mask } from '@true-directive/base';
import { MaskState } from '@true-directive/base';
import { MaskSettings } from '@true-directive/base';

import { DateParserFormatter } from '@true-directive/base';
import { Locale } from '@true-directive/base';

@Directive({
    selector: '[true-mask-date]',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => MaskDateDirective),
        multi: true}]
})
export class MaskDateDirective extends MaskBaseDirective implements ControlValueAccessor {

    private _dateValue: any;

    // Implementing ControlValueAccessor
    private onChange = (_: any) => {};
    private onTouched = () => {};

    registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
    registerOnTouched(fn: () => void): void { this.onTouched = fn; }

    @HostListener('input', ['$event'])
    onInput(e: any) {
      this.input(e.target.value);
    }

    // Focus lost
    @HostListener('blur', ['$event'])
    blur(e: any) {

      // No need to parse once more if result is as expected
      let autoCorrected = this._mask.applyMask(this._txtValue);
      if (autoCorrected !== this._txtValue) {
        this.setText(autoCorrected);
      }

      // Clearing if Date is incorrect
      if (this._dateValue === null || isNaN(this._dateValue.getTime())) {
        if (!this._mask.settings.allowIncomplete) {
          this.setText('');
        }
      }

      this.onTouched();
    }

    // Updating the state
    protected updateState() {
      if (!this._dateValue) {
        this.state = MaskState.EMPTY; // empty value
      } else {
        if (isNaN(this._dateValue.getTime())) {
          this.state = MaskState.TYPING; // User input is in progress
        } else {
          this.state = MaskState.OK;
        }
      }
    }

    // Sending a value to model
    protected toModel() {
      // Retrieving value
      this._dateValue = DateParserFormatter.parse(this._txtValue, this._mask);
      this.maskValueChanged.emit(this._dateValue);
      // Sending to model
      this.onChange(this._dateValue);
      // Updating the state
      this.updateState();
    }

    //
    public processKey(e: any): boolean {
      return super.processKey(e);
    }

    // Parser: View --> Ctrl
    @HostListener('input', ['$event'])
    input(e: any) {
      this.doInput(e.target.value);
    }

    // Formatter: Ctrl --> View
    writeValue(value: any) {
      this._dateValue = value;
      const txt = DateParserFormatter.format(value, this._mask);      
      if (txt !== this._txtValue) {
        this.setText(txt, false);
      }

      // No need to send to model, because this processor is called on model change
      // but state still needs to be updated
      this.updateState();
    }

    @Input('true-mask-date')
    public set pattern(m: string) {
      this._mask.pattern = m;
    }

    public get pattern(): string {
      return this._mask.pattern;
    }

    @Input('true-mask-settings')
    set settings(v: MaskSettings) {
      this._mask.settings = v;
    }

    @HostListener('keydown', ['$event'])
    keyDown(e: any) {
      return this.processKey(e);
    }

    setLocale(locale: Locale) {
      super.setLocale(locale);
      this._mask.updateMask(); // Changing format
      this.writeValue(this._dateValue); // Updating view
    }

    constructor(protected _renderer: Renderer2, protected _elementRef: ElementRef, protected intl: InternationalizationService) {
      super(_renderer, _elementRef, intl);
    }
}
