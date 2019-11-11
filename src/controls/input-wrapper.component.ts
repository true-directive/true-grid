/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, HostBinding, EventEmitter } from '@angular/core';

@Component({
    selector: 'true-input-wrapper',
    // It is important that the button follows the content without line breaking.
    // Otherwise a suspicious margin to the right of the button appears.
    //
    // Inner DIV with display=flex to avoid line breaking if the width of the component = 100%
    template: `
    <div>
      <ng-content></ng-content><button
          *ngIf="icon"
          type="button"
          tabindex="-1"
          class="true-input__btn"
          [attr.disabled]="disabled"
          (click)="btnClick($event)">
        <div [ngClass]="icon"></div>
      </button>
    </div>
    <div *ngIf="showError" class="true-input__err-msg">{{error}}</div>
    `,
    host: { 'class': 'true-input' },
    styles:[`
      :host {
        overflow-x: visible;
        word-wrap: normal;
        display: inline-block;
        vertical-align: baseline;
        padding: 0;
        margin: 0;
      }

      :host > div:first-child {
        width: 100%;
        height: 100%;
        display: inline-flex;
      }

      .true-input__err-msg {
        position: absolute;
        display: none;
      }

      :host.true-input_with-error > .true-input__err-msg {
        display: block;
      }

    `]
})
export class InputWrapperComponent {

  @HostBinding('class.true-input_with-btn')
  get hasBtn() {
    return this.icon !== undefined && this.icon !== "";
  }

  @HostBinding('class.true-input_with-error')
  get hasError() {
    return this.error !== undefined && this.error !== "";
  }

  @Input('icon')
  icon: string;

  @Input('error')
  error: string;

  @Input('showError')
  showError: boolean = true;

  @Input('disabled')
  disabled: boolean = null;

  @Output('btnClick')
  onBtnClick: EventEmitter<any> = new EventEmitter<any>();

  btnClick(e: any) {
    this.onBtnClick.emit(e);
    e.stopPropagation();
  }
}
