/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, HostBinding, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Checkbox component
 */
@Component({
  selector: 'true-checkbox',
  template:`
      <true-checkbox-wrapper [class.inversed]="inversed">
        <input type="checkbox" [(ngModel)]="value" (blur)="blur()"/>
        <span caption>{{caption}}</span>
      </true-checkbox-wrapper>
    `,
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true}]
  })
export class CheckboxComponent implements ControlValueAccessor {

  private onChange = (_: any) => {};
  private onTouched = () => {};

  registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  private _value: any;

  get value(): any {
    return this._value;
  };

  set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  @Input('caption')
  caption: string = '';

  @Input('inversed')
  _inversed: any;

  @HostBinding('class.inversed')
  get inversed() {
    return this._inversed;
  }

  blur() {
    this.onTouched();
  }

  // Show value. Formatter: Ctrl --> View
  writeValue(value: any): void {
    if (this._value !== value) {
      this._value = value;
    }
  }
}
