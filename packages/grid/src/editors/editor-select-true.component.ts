/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, ViewChild,
         Renderer2, OnDestroy } from '@angular/core';

import { Subject, Observable } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

import { Column, ColumnType, GridSettings } from '@true-directive/base';
import { Keys } from '@true-directive/base';

import { GridStateService } from '../grid-state.service';
import { DropdownBaseComponent } from '../controls/dropdown-base.component';
import { IEditor } from "./editor.interface";

@Component({
  selector: 'true-editor-select-true',
  template: `<div [ngClass]="getClass()">
              <true-select #input
                class="true-editor-select__selector"
                [(ngModel)]="value"
                [style.height]="getH()"
                [valueField]="valueField"
                [displayField]="displayField"
                [columns]="columns"
                [settings]="settings"
                [items]="items"
                [useAltDown]="true"
                [maxDropDownHeight]="maxDropDownHeight"
                [disableTextEditor]="disableTextEditor"
                (mousedown)="inputMouseDown($event)"
                (itemSelect)="inputItemSelect($event)"
                (keydown)="inputKeyDown($event)"></true-select>
            </div>`,
  styleUrls: ['./editor-select-true.component.scss']
  })
export class EditorSelectTrueComponent implements IEditor, OnDestroy {

  protected destroy$: Subject<boolean> = new Subject<boolean>();

  private ie: boolean = false;
  private valueChanged: boolean = false;
  private height: number = 0;
  private wasShown = false;

  private initialized = false;

  private _value: any = null;
  public get value(): any {
    return this._value;
  }

  public set value(v: any) {
    this._value = v;
    this.change.emit(v);
  }

  public get maxDropDownHeight(): string {
    return this.state.settings.maxDropDownHeight;
  }

  public displayValue: string = '';

  public disableTextEditor = false;

  state: GridStateService;
  column: Column;
  row: any;

  @ViewChild('input')
  input: DropdownBaseComponent;

  @Output("commit")
  commit: EventEmitter<string> = new EventEmitter();

  @Output("change")
  change: EventEmitter<any> = new EventEmitter();

  @Output("cancel")
  cancel: EventEmitter<void> = new EventEmitter();

  /**
   * Список колонок выпадающего списка
   */
  private _columns: Column[] = null;
  get columns(): Column[] {
    if (this._columns === null) {
      if (this.column.optionsColumns !== null) {
        this._columns = this.column.optionsColumns;
      } else {
        this._columns = [new Column('name', 'name', 300, ColumnType.STRING)];
      }
    }
    return this._columns;
  }

  /**
   * Настройки грида в выпадающем списке
   */
  private _settings: GridSettings = null;
  get settings() {
    if (this._settings === null) {
      this._settings = GridSettings.minimal();
      this._settings.appearance.class = this.state.settings.appearance.class;
      this._settings.appearance.enableFocusedAppearance = false;
      this._settings.showHeader = false;
      this._settings.searchDelay = 100;
    }
    return this._settings;
  }

  /**
   * Данные выпадающего списка
   */
  private _items: any[] = null;
  get items(): any[] {
    if (this._items === null) {
      if (this.column.optionsData instanceof Observable) {
        // Подпись
        const observable = <Observable<any>>this.column.optionsData;
        observable.pipe(takeUntil(this.destroy$)).subscribe(data => {
          this._items = data;
        });
      } else {
        this._items = this.column.optionsData;
      }
    }
    return this._items;
  }

  private _valueField: string = null;
  public get valueField(): string {
    if (this._valueField === null) {
      this._valueField = this.columns[0].fieldName;
    }
    return this._valueField;
  }

  private _displayField: string = null;
  public get displayField(): string {
    if (this._displayField === null) {
      this._displayField = this.columns[0].fieldName;
    }
    return this._displayField;
  }

  init(value: any, valueChanged: boolean, height: number, ie: boolean = false, wasShown: boolean = false) {
    if (this.state.touchMode) {
      this.input.popupPosition = 'MODAL';
      this.disableTextEditor = true;
    }

    if (valueChanged) {
      if (!this.disableTextEditor) {
        this.displayValue = value;
        this.valueChanged = true;
      } else {
        this.valueChanged = false;
      }
      this.change.emit(null);
    } else {
      // Без события об изменении
      this._value = value;
    }

    this.wasShown = wasShown;
    this.height = height;
    this.ie = ie;
  }

  inputItemSelect(e: any) {
    if (this.state.touchMode) {
      this.commit.emit(this.value);
    }
  }

  // Останавливаем propagation, чтобы не влиять на grid
  inputMouseDown(e: any) {
    e.stopPropagation();
  }

  inputKeyDown(e: any) {

    if (e.defaultPrevented) {
      return;
    }

    if (e.keyCode === Keys.TAB) {
      this.input.setValueFromDisplayed();
      return;
    }

    if (e.keyCode === Keys.UP ||
        e.keyCode === Keys.DOWN ||
        e.keyCode === Keys.PAGE_UP ||
        e.keyCode === Keys.PAGE_DOWN) {
      // По идее просто их должен отработать грид
      e.stopPropagation();
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
    if (!this.valueChanged) {
      if (this.state.touchMode) {
        // На тач устройствах не будем фокусироваться на инпуте,
        // нам достаточно показать форму для выбора в модальном режиме
        if (!this.wasShown) {
          setTimeout(() => this.input.showByTarget());
        }
      } else {
        setTimeout(() => this.input.focus());
      }
      return;
    }

    this.input.focus();
    setTimeout(() => {
      this._renderer.setProperty(this.input.input.nativeElement, 'value', this.displayValue);
      this._renderer.setProperty(this.input.input.nativeElement, 'selectionStart', this.displayValue.length);
      this._renderer.setProperty(this.input.input.nativeElement, 'selectionEnd', this.displayValue.length);
      this.input.displayValue = this.displayValue === null ? '' : this.displayValue;
      this.input.inputInput();
    });
  }

  // Если у нас есть информация о высоте строки - берем её и не
  // назначаем никакого класса
  getClass() {
    if ((this.height !== null && this.height > 0)) {
      return 'true-grid__input-container';
    }
    if (this.ie) {
      return 'true-grid-editor-ie';
    }
    return 'true-grid-editor-100p';
  }

  getH() {
    if (this.height !== null && this.height > 0) {
      return this.height + 'px';
    }
    return '100%';
  }

  ngOnDestroy() {
    // Если нас удаляют...
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  constructor(protected _renderer: Renderer2) { }
}
