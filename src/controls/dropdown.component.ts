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
import { Keys } from '@true-directive/base';

/**
 * Dropdown component.
 */
@Component({
  selector: 'true-drop-down-box',
  template:`
      <div>
        <div #content></div><button
            *ngIf="icon"
            type="button"
            tabindex="-1"
            class="true-input__btn"
            [attr.disabled]="disabled"
            (click)="btnClick($event)">
          <div [ngClass]="icon"></div>
        </button>
      </div>
      <true-popup #popup (close)="popupClose($event)" (show)="popupShow($event)" >
        <true-grid #grid *ngIf="popupVisible"
                 class="true-select__grid"
                 [style.width]="gridWidth()"
                 [columns]="columns"
                 [dataSource]="items"
                 [settings]="settings"
                 (dataQuery)="gridDataQuery($event)"
                 (rowClick)="gridRowClick($event)">
        </true-grid>
        <div *ngIf="empty()" class="true-select__notfound">Ничего не найдено</div>
        <div *ngIf="updating()" class="true-select__updating">Загрузка...</div>
      </true-popup>
    `,
  styles: [`
    :host {
      display: inline-block;
    }

    .true-select__grid {
      border: none !important;
      cursor: pointer;
    }

    .true-select__notfound, .true-select__updating {
      padding: 0.5em;
      color: #aaa;
    }
  `],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectorComponent),
      multi: true}]
  })
export class DropDownComponent extends DropdownBaseComponent {

  // Current text value
  public displayValue: string = '';

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

  // Data query
  @Output('dataQuery')
  dataQuery: EventEmitter<any> = new EventEmitter<any>();

  private _focusedValue: any = null;

  private _valueField = 'id';

  @Input('valueField')
  public set valueField(fieldName: string) {
    this._valueField = fieldName;
    if (this._settings) {
      // Settings may haven't yet been created.
      this._settings.keyField = this.valueField;
    }
  }

  public get valueField() {
    return this._valueField;
  }

  @Input()
  displayField: string = 'name';

  @Input()
  columns: Array<Column>;

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

  @ViewChild('grid', {static: true})
  grid: GridComponent;

  // Выбираем ли мы из грида
  // If the value is selected from the grid
  _onGrid: boolean = false;

  gridDataQuery(e: any) {
    this.dataQuery.emit(e);
  }

  // Send the value to input. Formatter: Ctrl --> View
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
  // Setting the value and the displayValue at once
  setValue(value: any, displayValue: string) {
    if (value !== this._value || displayValue !== this.displayValue) {
      this._focusedValue = value;
      this._value = value;
      this.displayValue = displayValue;
      this.onChange(this._value);
    }
  }

  // По введенному тексту ничего не найдено?
  // Input text isn't found in items
  empty(): boolean {
    return this.grid && this.grid.resultRows && this.grid.resultRows.length === 0 && !this.grid.dataUpdating;
  }

  // If updating of the data is in progress
  updating(): boolean {
    return this.grid && (!this.grid.resultRows || this.grid.resultRows.length === 0) && this.grid.dataUpdating;
  }

  // Data query reply
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

  gridWidth() {
    let ww = 0;
    this.columns.forEach(c => ww += c.width);
    return ww + this.settings.widthUnit;
  }

  // Перекрываем показывание выпадающего окна, чтобы обновить вью грида
  // и выделить строку, содержащую текущее значение
  /**
   * Overriding of popupShow method to update the grid's view and select row
   * containing the current value
   * @param  e Event parameters
   */
  popupShow(e: any) {
    this._onGrid = false;

    if (this._value !== null) {
      this.grid.locateByKey(this._value);
    } else {
      if (this.shownByKey) {
        this.grid .processKey(Keys.generateEvent(null, Keys.DOWN)); // Будет выбрана первая запись
      }
    }
    this.grid.checkSize();
  }

  // Обработчик клавиш вызывается из родительского класса
  // Возвращает false, если клавиша не обработана
  /**
   * Key event handler. This method is invoked by parent class.
   * @param  e Key event parameters
   * @return   Returns false if the key was not handled.
   */
  processKey(e: any): boolean {
    if (!this.popupVisible) {
      return false;
    }

    if (e.keyCode === Keys.ESCAPE) {
      this.popup.closePopup();
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.keyCode === Keys.ENTER && this.popupVisible) {
      this.setValueFromGrid();
      this.popup.closePopup();
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

  /**
   * Row click handler
   * @param  e Mouse event parameters
   */
  gridRowClick(e: any) {
    this._onGrid = true;
    this._skipFocusOnPopupClose = false;
    this.value = e.row[this.valueField];
    this.popup.closePopup();
  }

  /**
   * Icon rotation
   */
  iconClass() {
    let s = 'true-icon-angle-down true-turnable';
    if (this.popupVisible) {
      s += ' true-turned';
    }
    return s;
  }

  // User's input
  inputInput(e: any) {

    // Popup hasn't been shown yet.
    if (!this.popupVisible && this.displayValue !== '') {
      // Show by target position
      this.showByTarget();
    }

    if (this.popupVisible) {
      setTimeout(() => {
        // Set search string
        this.grid.searchString = this.displayValue;
      });
    }

    this._value = null;
  }

  /**
   * Return the selected row from the grid
   * @return Selected row
   */
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

  /**
   * Setting of the value by selected row of the grid
   */
  private setValueFromGrid() {
    let sel = this.getSelectedRow();
    if (sel && (this._onGrid || this.containsDisplayed(sel[this.displayField]))) {
      this.setValue(sel[this.valueField], sel[this.displayField]);
    } else {
      this.setValueFromDisplayed();
    }
  }

  /**
   * Setting of the value by input text
   */
  private setValueFromDisplayed() {

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
   * Losing the focus by input
   * @param  e Blur event parameters
   */
  inputBlur(e: FocusEvent) {
    this._skipFocusOnPopupClose = true;

    if ((this.value === null || this.value === undefined) && this.displayValue !== '') {
      this.closePopup();
      this.setValueFromDisplayed();
    }
    super.inputBlur(e);
  }

  constructor(
    protected _elementRef: ElementRef,
    protected _renderer: Renderer2) {
      super(_elementRef, _renderer);
      this._useAltDown = false;
  }
}
