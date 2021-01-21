/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core';

import { Column } from '@true-directive/base';
import { GridStateService } from '../grid-state.service';
import { Keys } from '@true-directive/base';
import { DOMUtils } from '../common/dom-utils.class';

import { IEditor } from "./editor.interface";

// showPopupRelative - устанавливаем position: relative для popup container
// Если этого не сделать, то popup-element будет увеличивать data area.
// Вообще этот параметр сделает невозможным редактирование даты в
// абсолютно позиционированных контейнерах (модальные окна, например).
@Component({
  selector: 'true-editor-date',
  template:
  `<div class="true-grid__input-container" [style.height]="getH()">
    <true-datepicker #datepicker
      class="true-editor-date__datepicker"
      [pattern]="column.format"
      [ngClass]="getClass()"
      [inputClass]="datepickerInputClass"
      [showError]="false"
      [(ngModel)]="value"
      (keydown)="inputKeyDown($event)"
      (ngModelChange)="datepickerChange($event)">
    </true-datepicker>
  </div>`,
  styles: [`
    :host {
      padding: 0;
      margin: 0;
      border: 0;
    }
    .true-editor-date__datepicker {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
    }
    `]
  })
export class EditorDateComponent implements IEditor  {

  ie: boolean;
  value: any = null;
  valueTemp: any;
  valueChanged: boolean;
  height: number;

  datepickerInputClass = 'true-grid-input';

  @ViewChild('datepicker', {static: true})
  datepicker: any;

  // Implementation of IEditor
  state: GridStateService;
  column: Column;
  row: any;

  @Output("commit")
  commit: EventEmitter<any> = new EventEmitter();

  @Output("cancel")
  cancel: EventEmitter<any> = new EventEmitter();

  @Output("change")
  change: EventEmitter<any> = new EventEmitter();

  private _initialized = false;
  init(value: any, valueChanged: boolean, height: number, ie: boolean = false, wasShown: boolean = false) {

    if (this.state.touchMode) {
      this.datepicker.popupPosition = 'MODAL';
    } else {
      this.datepicker.popupPosition = 'RELATIVE';
    }

    this.ie = ie;
    this.valueTemp = value;
    this.valueChanged = valueChanged;
    this.height = height;

    if (this.state.iOS) {
      DOMUtils.focusAndOpenKeyboard(this.datepicker.input.nativeElement, 50);
    }
  }

  ngAfterContentInit() {
    if(!this.valueChanged) {
      this.value = this.valueTemp;
      setTimeout(() => this.datepicker.focus());
      this._initialized = true;
    } else {
      this.datepicker.focus();
      const txt = this.valueTemp;
      setTimeout(() => {
        for (let i = 0; i < txt.length; i++) {
          const e = Keys.generateEvent(null, 0, txt[i]);
          this.datepicker.acceptKey(e);
        }
        this._initialized = true;
      });
    }

    // Не помогает
    // setTimeout(() => this.changeDetector.detectChanges(), 100);
  }

  datepickerChange(e: any) {
    if (this._initialized) {
      this.change.emit(this.purify(e));
    }
  }

  inputMouseDown(e: any) {
    e.stopPropagation();
  }

  inputKeyDown(e: any) {

    if (e.keyCode === Keys.UP || e.keyCode === Keys.DOWN || e.keyCode === Keys.TAB) {
      return;
    }

    if (e.keyCode === Keys.ESCAPE) {
      this.cancel.emit(false);
      return;
    }

    e.stopPropagation();

    if (e.keyCode === Keys.ENTER) {
      this.commit.emit(this.purify(this.value));
      return;
    }
  }

  getClass() {
    let res = 'true-editor-date__datepicker';
    if (this.height !== null && this.height > 0) {
      return res;
    }

    if (this.ie) {
      return res + ' true-grid-editor-ie';
    } else {
      return res + ' true-grid-editor-100p';
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

  constructor(private changeDetector: ChangeDetectorRef) { }
}
