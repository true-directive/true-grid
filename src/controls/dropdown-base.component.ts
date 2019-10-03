/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, HostBinding, EventEmitter, Renderer2, ElementRef,
         ViewChild, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PopupComponent } from './popup.component';

import { Keys, Utils, PopupPosition } from '@true-directive/base';
import { DataQuery } from '@true-directive/base';

/**
 * Dropdown base component.
 */
export abstract class DropdownBaseComponent implements ControlValueAccessor, OnDestroy {

  usePopup: boolean = true;

  @ViewChild('popup')
  popup: PopupComponent;

  @ViewChild('input')
  input: any;

  @Input('disableTextEditor')
  disableTextEditor = false;

  @Input('disabled')
  disabled: boolean = null;

  @Input('maxDropDownHeight')
  maxDropDownHeight = '300px';

  @Input('popupPosition')
  public get popupPosition(): 'RELATIVE' | 'ABSOLUTE' | 'MODAL' {
    return this.popup.position;
  }

  public set popupPosition(pos: 'RELATIVE' | 'ABSOLUTE' | 'MODAL') {
    this.popup.position = pos;
  }

  @Output('blur')
  blur: EventEmitter<any> = new EventEmitter<any>();

  @Output('keydown')
  keydown: EventEmitter<any> = new EventEmitter<any>();

  protected onChange = (_: any) => {};
  protected onTouched = () => {};

  registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  protected _validBlur = false;
  protected _useAltDown = true;

  public displayValue: string;

  @Input('useAltDown')
  public set useAltDown(v: boolean) {
    this._useAltDown = v;
  }

  public get useAltDown(): boolean {
    return this._useAltDown;
  }

  protected shownByKey = false;

  fetchData(dataQuery: DataQuery, data: Array<any>) {
    //
  }

  inputBlur(e: FocusEvent) {

    // This touch was accepted
    this.onTouched();

    // We shouldn't close window if the focus is moved to a popup window
    let l = e.relatedTarget;
    if (l === null || Utils.isAncestor(this.popup.popup.nativeElement, l)) {

      // l = null if the focus is moved to a grid because tabIndex = -1
      // If the focus is moved to another element, then l != null
      // If the focus is moved by mouse click, then documentclick event occurs
      // and popup will be closed.
      return;
    }

    if (l === null || Utils.isAncestor(this._elementRef.nativeElement, l)) {
      // Window isn't closed if the focus moved to one of child elements
      return;
    }

    // Close the popup window
    if (this.popup.visible && !this._validBlur) {
      this._skipFocusOnPopupClose = true;
      this.popup.closePopup();
    }

    // Reset the flag
    this._validBlur = false;

    this.blur.emit(e);
  }

  inputClick(e: any) {

    // Prevent popup from disabled input
    if (this.disabled) {
      return;
    }

    if (this.disableTextEditor) {
      if (this.popupVisible) {
        this.closePopup();
      } else {
        this.showByTarget();
      }
      e.stopPropagation();
      e.preventDefault();
    }
  }

  private _touched = false;
  inputTouchStart(e: any) {
    this._touched = true;
    if (this.disableTextEditor) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  inputTouchMove(e: any) {
    this._touched = false;
  }

  inputTouchEnd(e: any) {
    if (this.disableTextEditor) {
      if (!this.popupVisible && this._touched) {
        // Show the popup window by touchend event
        this.showByTarget();
      }
      e.stopPropagation();
    }
  }

  protected _value: any;

  public get value(): any {
    return this._value;
  };

  public set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  // Send the value to input. Formatter: Ctrl --> View
  writeValue(value: any): void {
    if (this.value !== value) {
      this.value = value;
    }
  }

  get popupVisible() {
    return this.popup.visible;
  }

  protected focusPopup() {
    //
  }

  protected processKey(e: any) {
    return false;
  }

  public showByTarget() {
    if (!this.usePopup) {
      return;
    }
    this.popup.showByTarget(this.input.nativeElement);
  }

  public closePopup() {
    this.popup.closePopup();
  }

  /**
   * User's input
   * @param  e Input event
   */
  public inputInput(e: any = null) {
    //
  }

  inputKeyDown(e: any) {
    if (e.keyCode === Keys.ESCAPE && this.popup.visible) {
      this.closePopup();
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    if (e.keyCode === Keys.DOWN && (e.altKey || !this.useAltDown) && !this.popup.visible) { //
      this.shownByKey = true;
      this.showByTarget();
      setTimeout(() => this.focusPopup());
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!this.processKey(e)) {
      this.keydown.emit(e);
    }
  }

  focus() {
    this.input.nativeElement.focus();
  }

  _skipFocusOnPopupClose = false;
  popupClose(e: any) {

    // Можем пропустить это мероприятие, если мы закрываем выпадающую панель,
    // находясь в контроле
    // Skip setting the focus if dropdown is closed.
    if (this._skipFocusOnPopupClose) {
      this._skipFocusOnPopupClose = false;
      return;
    }

    if (!Utils.detectMobile()) {
      // We allow the user to set the focus on input.
      this.input.nativeElement.focus();
      setTimeout(() => {
        const txt = this.input.nativeElement.value;
        if (txt !== undefined && !this.disableTextEditor && this._renderer) {
          this._renderer.setProperty(this.input.nativeElement, 'selectionStart', 0);
          this._renderer.setProperty(this.input.nativeElement, 'selectionEnd', txt.length);
        }
      });
    }
  }

  inputFocus(e: any) {
    if (this.disableTextEditor) {
      this._renderer.setProperty(this.input.nativeElement, 'selectionStart', 0);
      this._renderer.setProperty(this.input.nativeElement, 'selectionEnd', 0);
    } else {
      const txt = this.input.nativeElement.value;
      this._renderer.setProperty(this.input.nativeElement, 'selectionStart', 0);
      this._renderer.setProperty(this.input.nativeElement, 'selectionEnd', txt.length);
    }
  }

  btnClick(e: any) {
    if (this.disabled) {
      return;
    }

    this.popup.toggle(this._elementRef.nativeElement, '');

    setTimeout(() => {
      if (this.popupVisible) {
        this.focusPopup();
      }
    });
  }

  public setValueFromDisplayed() {
    //
  }

  ngOnDestroy() {
    if (this.popupVisible) {
      this.popup.closePopup();
    }
  }

  constructor(
    protected _elementRef: ElementRef,
    protected _renderer: Renderer2) { }
}
