/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
         Renderer2 } from '@angular/core';

import { Column } from '@true-directive/base';
import { Keys } from '@true-directive/base';
import { Utils } from '@true-directive/base';

import { CalendarComponent } from '../controls/calendar.component';
import { PopupComponent } from '../controls/popup.component';
import { MaskDateDirective } from  '../mask/mask-date.directive';

import { GridStateService } from '../grid-state.service';
import { IEditor } from "./editor.interface";
import { DOMUtils } from '../common/dom-utils.class';

@Component({
  selector: 'true-editor-test',
  /*template: `<true-datepicker #datepicker
    class="true-grid__input-container"
    [pattern]="column.format"
    [ngClass]="getClass()"
    [style.height]="getH()"
    [inputClass]="datepickerInputClass"
    [showError]="false"
    [(ngModel)]="value"
    (keydown)="inputKeyDown($event)"
    (ngModelChange)="datepickerChange($event)">
  </true-datepicker>`,
  */
  template: `<true-input-wrapper
    class="true-datepicker__input"
    (btnClick)="btnClick($event)"
    [ngClass]="getClass()"
    [style.height]="getH()"
    [icon]="getIcon()"><input #input
                  class="true-grid-input"
                  [true-mask-date]="column.format"
                  [(ngModel)]="value"
                  (ngModelChange)="inputChange($event)"
                  [style.height]="getH()"
                  (mousedown)="inputMouseDown($event)"
                  (keydown)="inputKeyDown($event)" /></true-input-wrapper><true-popup #popup (close)="popupClose($event)">
                    <true-calendar #calendar
                        *ngIf="popupVisible"
                        [(ngModel)]="value"
                        (escape)="escape($event)"
                        (dateClick)="dateClick($event)">
                    </true-calendar>
                  </true-popup>`,
  styles: [`
    :host {
      padding: 0;
    }
    .true-datepicker__input {
      border: 0;
    }
    `]
  })
export class EditorTestComponent implements IEditor {

  private ie: boolean = false;
  private valueTemp: any = false;
  private valueChanged: boolean = false;
  private height: number = 0;

  public value: any;
  datepickerInputClass = 'true-grid-input';

  state: GridStateService;
  column: Column;
  row: any;

  private _initialized = false;

  @ViewChild('popup')
  popup: PopupComponent;

  @ViewChild('input')
  input: any;

  @ViewChild('calendar')
  calendar: CalendarComponent;

  @ViewChild('input', {read: MaskDateDirective})
  maskDateDirective: MaskDateDirective;

  @Output("commit")
  commit: EventEmitter<string> = new EventEmitter();

  @Output("change")
  change: EventEmitter<any> = new EventEmitter();

  @Output("cancel")
  cancel: EventEmitter<void> = new EventEmitter();

  get popupVisible() {
    return this.popup.visible;
  }

  getIcon(): string {
    return 'true-icon-calendar-empty';
  }

  datepickerChange(e: any) {
    if (this._initialized) {
      this.change.emit(this.purify(e));
    }
  }

  dateClick(e: any) {
    this.inputChange(e);
    this.popup.closePopup();
  }

  togglePopup() {
    this.popup.toggle(this._elementRef.nativeElement, '');
    setTimeout(() => {
      if (this.popupVisible) {
        this.focusPopup();
      }
    });
  }

  btnClick(e: any) {
    this.togglePopup();
  }

  popupClose(e: any) {

    if (!Utils.detectMobile()) {
      // We allow the user to set the focus on input.
      this.input.nativeElement.focus();
      setTimeout(() => {
        const txt = this.input.nativeElement.value;
        if (txt !== undefined && this._renderer) {
          this._renderer.setProperty(this.input.nativeElement, 'selectionStart', 0);
          this._renderer.setProperty(this.input.nativeElement, 'selectionEnd', txt.length);
        }
      });
    }
  }

  init(value: any, valueChanged: boolean, height: number, ie: boolean = false, wasShown: boolean = false) {

    if (this.state.touchMode) {
      this.popup.position = 'MODAL';
    } else {
      this.popup.position = 'RELATIVE';
    }

    this.valueTemp = value;
    this.valueChanged = valueChanged;
    this.height = height;
    this.ie = ie;
    if (this.state.iOS) {
      DOMUtils.focusAndOpenKeyboard(this.input.nativeElement, 50);
    }
  }

  // Останавливаем propagation, чтобы не влиять на grid
  inputMouseDown(e: any) {
    e.stopPropagation();
  }

  inputChange(e: any) {
    this.change.emit(e);
  }

  inputKeyDown(e: any) {

    if (e.defaultPrevented) {
      return;
    }

    if (e.keyCode === Keys.DOWN && e.altKey && !this.popup.visible) {
      this.togglePopup();
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.keyCode === Keys.UP ||
        e.keyCode === Keys.DOWN ||
        e.keyCode === Keys.PAGE_UP ||
        e.keyCode === Keys.PAGE_DOWN ||
        e.keyCode === Keys.TAB) {
      // По идее просто их должен отработать грид
      return;
    }

    e.stopPropagation();

    if (e.keyCode === Keys.ESCAPE) {
      this.cancel.emit();
      return;
    }

    if (e.keyCode === Keys.ENTER) {
      this.commit.emit(this.value);
      return;
    }
  }

  escape(e: any) {
    this.popup.closePopup();
  }

  acceptKey(e: any) {
    this.maskDateDirective.keyDown(
      Keys.generateEvent(this.input.nativeElement, -1, Keys.keyChar(e), e.shiftKey, e.ctrlKey)
    );
  }

  ngAfterContentInit() {

    if(!this.valueChanged) {
      this.value = this.valueTemp;
      // The pattern hasn't applied yet.
      this.maskDateDirective.pattern = this.column.format;
      this.maskDateDirective.writeValue(this.value);
      setTimeout(() => {
        if (!this.state.touchMode) {
          // Select all if not mobile device
          this.input.nativeElement.select()
        }
        this.input.nativeElement.focus();
      });
      this._initialized = true;
    } else {
      this.input.nativeElement.focus();
      const txt = this.valueTemp;
      setTimeout(() => {
        for (let i = 0; i < txt.length; i++) {
          const e = Keys.generateEvent(null, 0, txt[i]);
          this.acceptKey(e);
        }
        this._initialized = true;
      });
    }
  }

  focusPopup() {
    this.calendar.setFocus();
  }

  // Если у нас есть информация о высоте строки - берем её и не
  // назначаем никакого класса
  getClass() {
    if ((this.height !== null && this.height > 0)) {
      return 'true-grid__input-container';
    }
    if (this.ie) {
      return 'true-grid-editor-ie';
    } else {
      return 'true-grid-editor-100p';
    }
  }

  getH() {
    if (this.height !== null && this.height > 0) {
      return this.height + 'px';
    }
    return '100%';
  }

  protected purify(v: any): any {
    if (v === undefined || v === null || isNaN(v.getTime())) {
      return null;
    }
    return v;
  }

  constructor(protected _renderer: Renderer2,
              protected _elementRef: ElementRef) { }
}
