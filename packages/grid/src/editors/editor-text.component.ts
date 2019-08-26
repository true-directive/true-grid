/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, ViewChild,
         Renderer2 } from '@angular/core';

import { Column } from '@true-directive/base';
import { Keys } from '@true-directive/base';

import { GridStateService } from '../grid-state.service';
import { IEditor } from "./editor.interface";

@Component({
  selector: 'true-editor-text',
  template: `<input #input class="true-grid-input"
                  [(ngModel)]="value"
                  (ngModelChange)="inputChange($event)"
                  [style.height]="getH()"
                  [ngClass]="getClass()"
                  (mousedown)="inputMouseDown($event)"
                  (keydown)="inputKeyDown($event)" />`,
  styles: [`
    :host {
      padding: 0;
    }
    `]
  })
export class EditorTextComponent implements IEditor {

  private ie: boolean = false;
  private valueChanged: boolean = false;
  private height: number = 0;

  public value: string;

  state: GridStateService;
  column: Column;
  row: any;

  @ViewChild('input')
  input: any;

  @Output("commit")
  commit: EventEmitter<string> = new EventEmitter();

  @Output("change")
  change: EventEmitter<any> = new EventEmitter();

  @Output("cancel")
  cancel: EventEmitter<void> = new EventEmitter();

  focusAndOpenKeyboard(el: any, timeout: number) {

    if (el) {
      // Align temp input element approximately where the input element is
      // so the cursor doesn't jump around
      var __tempEl__ = document.createElement('input');
      __tempEl__.style.position = 'absolute';
      __tempEl__.style.top = (el.offsetTop + 7) + 'px';
      __tempEl__.style.left = el.offsetLeft + 'px';
      __tempEl__.style.height = '0';
      __tempEl__.style.opacity = '0';
      // Put this temp element as a child of the page <body> and focus on it
      document.body.appendChild(__tempEl__);
      __tempEl__.focus();

      // The keyboard is open. Now do a delayed focus on the target element
      setTimeout(function() {
        el.focus();
        el.click();
        // Remove the temp element
        document.body.removeChild(__tempEl__);
      }, timeout);
    }
  }

  init(value: any, valueChanged: boolean, height: number, ie: boolean = false, wasShown: boolean = false) {
    this.value = value;
    this.valueChanged = valueChanged;
    this.height = height;
    this.ie = ie;
    if (this.state.iOS) {
      this.focusAndOpenKeyboard(this.input.nativeElement, 50);
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

  ngAfterContentInit() {
    if(!this.valueChanged) {
      if (this.state.iOS) {
        // Мы уже позаботились об этом при инициализации
      } else {
        setTimeout(() => {
          this.input.nativeElement.select()
          this.input.nativeElement.focus();
        });
      }
    } else {
      this.input.nativeElement.focus();
      this._renderer.setProperty(this.input.nativeElement, 'value', this.value);
      this._renderer.setProperty(this.input.nativeElement, 'selectionStart', this.value.length);
      this._renderer.setProperty(this.input.nativeElement, 'selectionEnd', this.value.length);
    }
  }

  // Если у нас есть информация о высоте строки - берем её и не
  // назначаем никакого класса
  getClass() {
    if ((this.height !== null && this.height > 0))
      return 'true-grid__input-container';
    if (this.ie)
      return 'true-grid-editor-ie';
    else
      return 'true-grid-editor-100p';
  }

  getH() {
    if (this.height !== null && this.height > 0) {
      return this.height + 'px';
    }
    return '100%';
  }

  constructor(protected _renderer: Renderer2) { }
}
