/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import { Column } from '@true-directive/base';
import { GridStateService } from '../grid-state.service';
import { Keys } from '@true-directive/base';

@Component({
  selector: 'true-editor-select',
  template: `<select #input
                  class="true-grid-input"
                  [(ngModel)]="value"
                  [style.height]="getH()"
                  [ngClass]="getClass()"
                  (mousedown)="inputMouseDown($event)"
                  (keydown)="inputKeyDown($event)"
                  (blur)="inputBlur($event)">
                <option value="CELL">CELL</option>
                <option value="ROW">ROW</option>
              </select>
                  `,
  styles: [`
    :host {
      padding: 0;
    }
    `]
  })
export class EditorSelectComponent  {

  ie: boolean = false;
  value: string = "";
  height: number = 0;

  @ViewChild('input') input: any;

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

  init(value: any, valueChanged: boolean, height: number, ie: boolean = false, wasShown: boolean = false) {
    this.ie = ie;
    this.value = value;
    this.height = height;
  }

  setValueAndFocus(value: any, selectAll: boolean = false) {
    this.input.nativeElement.focus();
  }

  inputMouseDown(e: any) {
    e.stopPropagation();
  }

  processKey(keyEvent: any) {
    //
  }

  inputKeyDown(e: any) {

    if (e.keyCode === Keys.TAB) {
      return;
    }

    e.stopPropagation();

    if (e.keyCode === Keys.ESCAPE) {
      this.cancel.emit(false);
      return;
    }

    if (e.keyCode === Keys.ENTER) {
      this.commit.emit(this.value);
      return;
    }
  }

  inputBlur(e: any) {
    this.cancel.emit(true);
  }

  // Если у нас есть информация о высоте строки - берем её и не
  // назначаем никакого класса
  getClass() {
    if ((this.height !== null && this.height > 0))
      return '';
    if (this.ie)
      return 'true-grid-editor-ie';
    else
      return 'true-grid-editor-100p';
  }

  getH() {
    if (this.height !== null && this.height > 0)
      return this.height + 'px';
    return '100%';
  }
}
