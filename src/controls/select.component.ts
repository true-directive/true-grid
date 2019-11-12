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
import { DropdownBaseComponent } from './dropdown-base.component';

import { GridSettings, GridState } from '@true-directive/base';
import { Column, DataQuery } from '@true-directive/base';
import { GridComponent } from '../grid.component';
import { Keys, Utils } from '@true-directive/base';

@Component({
  selector: 'true-select',
  template:`
      <true-input-wrapper
        (btnClick)="btnClick($event)"
        [disabled]="disabled"
        class="true-select__input"
        [class.true-input_popup-visible]="popupVisible"
        [icon]="iconClass()">
        <input #input
               [(ngModel)]="displayValue"
               [readonly]="disableTextEditor"
               [attr.disabled]="disabled"
               [class.true-disable-te]="disableTextEditor"
               (input)="inputInput($event)"
               (click)="inputClick($event)"
               (touchstart)="inputTouchStart($event)"
               (touchmove)="inputTouchMove($event)"
               (touchend)="inputTouchEnd($event)"
               (blur)="inputBlur($event)"
               (focus)="inputFocus($event)"
               (keydown)="inputKeyDown($event)"/>
      </true-input-wrapper>
      <true-popup #popup
        (close)="popupClose($event)"
        (show)="popupShow($event)" >
        <true-grid #grid
                 [class.true-select__grid_hidden]="empty()"
                 class="true-select__grid"
                 [maxHeight]="maxDropDownHeight"
                 [columns]="columns"
                 [data]="items"
                 [settings]="settings"
                 (dataQuery)="gridDataQuery($event)"
                 (startProcess)="gridStartProcess($event)"
                 (endProcess)="gridEndProcess($event)"
                 (rowClick)="gridRowClick($event)">
        </true-grid>
        <div *ngIf="empty()" class="true-select__notfound" [style.width]="gridWidth()">Ничего не найдено</div>
        <div *ngIf="updating()" class="true-select__updating">Загрузка...</div>
      </true-popup>
    `,
    /*
      Removed: :host { display: inline-block; } - invalid ios rendering.
     */
  styles: [`

    .true-select__input {
      width: 100%;
    }

    input {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
    }

    .true-select__grid_hidden {
      display: none;
    }

    .true-select__grid {
      border: none !important;
      cursor: pointer;
    }

    .true-select__notfound, .true-select__updating {
      padding: 0.6em;
      box-sizing: border-box;
      color: #aaa;
    }
  `],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true}]
  })
export class SelectComponent extends DropdownBaseComponent {

  /**
   * Current text value
   */
  public displayValue: string = '';

  /**
   * Current value
   */
  public set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.writeValue(this._value);
      this.onChange(v);
    }
  }

  public get value() {
    return this._value;
  }

  // Запрос данных
  @Output('dataQuery')
  dataQuery: EventEmitter<any> = new EventEmitter<any>();

  private _focusedValue: any = null;
  private _valueField: string = null;

  @Input('valueField')
  public set valueField(fieldName: string) {
    this._valueField = fieldName;
    if (this._settings) {
      // Настройки могут быть еще не созданы
      this._settings.keyField = this._valueField;
    }
  }

  public get valueField() {
    if (this._valueField === null && this.columns.length > 0) {
      return this.columns[0].fieldName;
    }
    return this._valueField === null ? 'id' : this._valueField;
  }

  private _displayField: string = null;
  @Input('displayField')
  public set displayField(fieldName: string) {
    this._displayField = fieldName;
  }

  public get displayField() {
    if (this._displayField === null && this.columns.length > 0) {
      return this.columns[0].fieldName;
    }
    return this._displayField === null ? 'name' : this._displayField;
  }

  @Input()
  columns: Array<Column> = [];

  @Input()
  items: Array<any>;

  @Input()
  parentState: GridState = null;

  private _settings: GridSettings = null;

  @Input('settings')
  set settings(v) {
    this._settings = v;
    this._settings.enableTouchScroll = false;
  }

  get settings() {
    if (!this._settings) {
      this._settings = GridSettings.minimal();
      this._settings.keyField = this.valueField;
      this._settings.widthUnit = 'em';
      this._settings.showHeader = false;
      this._settings.columnAutoWidth = false;
      this._settings.enableTouchScroll = false;
      this._settings.appearance.enableHoverAppearance = true;
    }
    return this._settings;
  }

  @Output('itemSelect')
  itemSelect: EventEmitter<any> = new EventEmitter();

  @ViewChild('grid')
  grid: GridComponent;

  // Выбираем ли мы из грида
  _onGrid: boolean = false;
  _empty = false;

  gridStartProcess(e: any) {
    if (this._empty && this.settings.requestData) {
      this._empty = false;
      this._updating = true;
    }
  }

  _updating = false;
  gridEndProcess(e: any) {
    setTimeout(() => {
      if (!this.popup.visible) {
        this.showByTarget();
      } else {
        // Let's update position of popup window. When list reduce, it may move
        // up or down regarding input.
        this.popup.updatePosition();
      }
    });

    this._updating = false;
    if (this.grid.resultRows.length === 0) {
      this._empty = true;
    } else {
      this._empty = false;
    }
  }

  gridDataQuery(e: any) {
    this.dataQuery.emit(e);
  }

  // Отображаем значение в компоненте. Formatter: Ctrl --> View
  writeValue(v: any) {
    this._value = v;
    let found = this.items.find(item => item[this.valueField] === v);
    if (!found) {
      this.displayValue = '';
    } else {
      this.displayValue = found[this.displayField];
    }
  }

  // За один раз устанавливаем и значение и отображение
  setValue(value: any, displayValue: string) {
    if (value !== this._value || displayValue !== this.displayValue) {
      this._focusedValue = value;
      this.displayValue = displayValue;
      this.value = value;
    }
  }

  // По введенному тексту ничего не найдено?
  empty(): boolean {
    return this._empty;
  }

  // Происходит обновление данных?
  updating(): boolean {
    return this._updating;
  }

  // Ответ
  fetchData(dataQuery: DataQuery, data: Array<any>) {
    let sel = this.getSelectedRow();
    if (sel) {
      this._focusedValue = sel[this.valueField];
    }

    if (this.grid && this.popupVisible) {
      this.grid.fetchData(dataQuery, data);

      if (this._focusedValue) {
        this.grid.locateByKey(this._focusedValue);
      } else {
        if (this._value !== null) {
          this.grid.locateByKey(this._value);
        }
      }
    }
  }

  /**
   * Общая ширина грида в выпадающем списке
   * @return Ширина в заданных единицах измерения
   */
  gridWidth() {
    let ww = 0;
    this.columns.forEach(c => ww += c.width);
    return ww + this.settings.widthUnit;
  }

  /**
   * Перекрываем показывание выпадающего окна, чтобы обновить вью грида
   * и выделить строку, содержащую текущее значение
   * @param  e Параметры события
   */
  popupShow(e: any) {
    this._onGrid = false;

    if (this._value !== null) {
        this.grid.locateByKey(this._value, this.valueField);
    } else {
      if (this.shownByKey) {
        this.grid.processKey(Keys.generateEvent(null, Keys.DOWN)); // Будет выбрана первая запись
      }
    }
    this.grid.checkSize();
  }

  /**
   * Обработчик клавиш вызывается из родительского класса
   * Возвращает false, если клавиша не обработана
   */
  processKey(e: any): boolean {

    if (e.keyCode === Keys.ENTER) {
      this.setValueFromGrid();
      this.popup.closePopup();
      return true;
    }

    if (!this.popupVisible) {
      return false;
    }

    if (e.keyCode === Keys.ESCAPE) {
      this.popup.closePopup();
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.keyCode === Keys.DOWN || e.keyCode === Keys.UP) {
      this._onGrid = true;
      this.grid.processKey(e);
      e.preventDefault();
      return true;
    }

    return false;
  }

  // Клик по записи в гриде
  public gridRowClick(e: any) {
    this._onGrid = true;
    this._skipFocusOnPopupClose = false;
    this.value = e.row[this.valueField];
    this.popup.closePopup();
    this.itemSelect.emit(e.row);
  }

  // Поворот иконки
  public iconClass() {
    let s = 'true-icon-angle-down true-turnable';
    if (this.popupVisible) {
      s += ' true-turned';
    }
    return s;
  }

  // Ввод текста пользователем
  public inputInput(e: any = null) {
    // Окошко еще на выпало? показываем
    if (!this.popupVisible && this.displayValue !== '') {
      this.grid.searchString = this.displayValue;
      return;
    }

    if (this.popupVisible) {
      setTimeout(() => {
        // Устанавливаем фильтр по тексту
        this.grid.searchString = this.displayValue;
      });
    }

    if (this.displayValue === '') {
      this.setValue(null, '');
      return;
    }

    this._value = null;
  }

  // Возврат выбранной строки в гриде
  private getSelectedRow(): any {
    if (this.grid && this.grid.state.selection.ranges.length > 0) {
      let item = this.grid.state.selection.ranges[0].fromCell.row;
      return item;
    }
    return null;
  }

  private containsDisplayed(s: string): boolean {
    return !this.displayValue || (s !== undefined && s.toLowerCase().indexOf(this.displayValue.toLowerCase()) >= 0);
  }

  // Установка значения по выделенной в гриде записи
  private setValueFromGrid() {

    if (!this.popupVisible && this.grid.state.model) {

      const found = this.grid.state.model.find(
          item => item[this.displayField].toLowerCase() === this.displayValue.toLowerCase()
      );

      if (found) {
        this.setValue(found[this.valueField], found[this.displayField]);
      } else {
        this.setValue(null, '');
      }
      return;
    }

    const sel = this.getSelectedRow();
    if (sel && (this._onGrid || this.containsDisplayed(sel[this.displayField]))) {
      this.setValue(sel[this.valueField], sel[this.displayField]);
    } else {
      this.setValueFromDisplayed();
    }
  }

  /**
   * Установка значения по введенному тексту
   */
  public setValueFromDisplayed() {
    // По запросу. Смотрим в гриде. Хотя, если подумать, можно всегда в гриде смотреть..
    let f = null;
    if (this.grid && this.grid.resultRows) {
      f = this.grid.resultRows.find(item => item[this.displayField].toLowerCase() === this.displayValue.toLowerCase());
    }
    if (f) {
      this.setValue(f[this.valueField], f[this.displayField]);
    } else {
      this.setValue(null, '');
    }
    return;
  }

  /**
   * Потеря фокуса инпутом
   * @param  e Параметры события
   */
  inputBlur(e: FocusEvent) {
    this._skipFocusOnPopupClose = true;
    if ((this.value === null || this.value === undefined) && this.displayValue !== '') {

      if (e.relatedTarget && Utils.isAncestor(this.popup.elementRef.nativeElement, e.relatedTarget)) {
        // Если фокус перешел на...
        return;
      }

      this.closePopup();
      this.setValueFromDisplayed();
    }
    super.inputBlur(e);
  }

  constructor(
    protected _elementRef: ElementRef,
    protected _renderer: Renderer2) {
      super(_elementRef, _renderer);
      this.useAltDown = false;
  }
}
