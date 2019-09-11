/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, HostBinding,
         ChangeDetectorRef,
         ViewChild } from '@angular/core';

import { ColumnType, DetectionMode, SelectionMode } from '@true-directive/base';
import { Column } from '@true-directive/base';
import { FilterOperator, Filter } from '@true-directive/base';
import { GridSettings } from '@true-directive/base';
import { GridState } from '@true-directive/base';

import { MenuComponent } from '../../controls/menu.component';
import { FilterBaseComponent } from './filter-base.component';

import { InternationalizationService } from '../../internationalization/internationalization.service';

@Component({
  selector: 'true-filter-text',
  templateUrl: 'filter-text.component.html',
  styles: [`
    :host {
      display: block;
      width: 25em;
    }

    .true-filter-text {
      display: block;
      width: 100%;
    }

    .true-filter-text input {
      width: 100%;
    }

    .true-filter-text__options {
      padding: 0;
      margin: 0.8em 0 0 0.2em;
    }

    .true-filter-text__mode-selector {
      float: right;
    }

    p {
      padding: 0;
      margin: 0.6em 0 0 0;
    }

    .true-link {
      margin: 0 0.0em 0 0;
    }

    .true-filter-text__items {
      padding-top: 1.5em;
    }

    .true-filter-text__grid {
      transition: border-color 0.2s ease;
      display: block;
      width: 100%;
      height: 20em;
    }

    .grid-error {
      border-color: #a00;
    }
    `]
  })
export class FilterTextComponent extends FilterBaseComponent {

  @Input() filter: Filter = null;
  @Input() rows: Array<any> = null;
  public state: GridState;


  // Ошибка пользовательского ввода
  inputError: string = '';
  gridError: string = '';

  // Список возможных операторов для этого типа фильтра
  operators = [
    FilterOperator.CONTAINS,
    FilterOperator.NOT_CONTAINS,
    FilterOperator.EQUALS,
    FilterOperator.NOT_EQUALS
  ];

  @ViewChild('input') input: any;
  @ViewChild('grid') grid: any;
  @ViewChild('operatorMenu') operatorMenu: MenuComponent;

  public listColumns: Column[] = [
    new Column('checked', 'Checked', 45, ColumnType.CHECKBOX, ''), // В некоторых местах четко задано 28
    new Column('caption', this.intl.translate('(All)'), 250, ColumnType.STRING, '')
  ];

  // IFilter implementation
  // Initialization
  public init() {
    this.selectMode = this.filter.operator === FilterOperator.SET;
    if (this.selectMode) {
      this.filter.operator = FilterOperator.CONTAINS;
    }
    this.listColumns[1].type = this.filter.type;
    setTimeout(() => {
      if (!this.selectMode) {
        this.input.nativeElement.select();
        this.input.nativeElement.focus();
      }
    }, 50);
  }

  // Validation
  public validate(): boolean {

    this.inputError = '';
    this.gridError = '';

    let checkedItems: any[] = [];

    // Чистим список значений в фильтре
    this.filter.items.splice(0, this.filter.items.length);

    if (this.selectMode) {
      // Хотя бы одно значение нужно отметить
      this.filter.operator = FilterOperator.SET;
      this.filter.items.splice(0, this.filter.items.length);
      checkedItems = this.items.filter(i => i.checked);
      if (checkedItems.length === 0) {
        this.gridError = 'Select values';
        return false;
      }
      checkedItems.forEach(i => this.filter.items.push(i.value));
    } else
      // Содержит/не содержит - нужно внести не пустую строку
      if (this.filter.operator === FilterOperator.CONTAINS ||
          this.filter.operator === FilterOperator.NOT_CONTAINS) {
        if (!this.filter.value) {
          this.inputError = 'Enter value';
          return false;
        }
      }

    return true;
  }


  public noText(): boolean {
      return this.selectMode
      || this.filter.operator === FilterOperator.EMPTY
      || this.filter.operator === FilterOperator.NOT_EMPTY;
  }

  // Получаем уникальные значения колонки
  // Этот код можно вынести в либу какую-нибудь
  private getItems(): Promise<Array<{checked: boolean, value: any, displayedValue: string}>> {
    return new Promise((resolve) => {

      const field = this.filter.fieldName;
      const col = this.state.columnByFieldName(field);

      // Копируем массив, сортируем, перебираем
      this.rows.concat().sort((i1, i2) => {
        return i1[field] === null ? -1 : i2[field] === null ? 1 : i1[field] > i2[field] ? 1 : -1;
      }).forEach(row => {

        // Значение
        const v = row[field];
        const v_displayed = this.state.dataSource.displayedValue(col, v, row);

        // Надпись
        let s = v_displayed === null ? '[empty]' : v_displayed;
        // Добавляем, если такого значения еще не было
        if ((this._items.length === 0 || this._items[this._items.length - 1].value !== v)) {
          this._items.push({
            checked: this.filter.items.indexOf(v) >= 0,
            value: v,
            displayedValue: v_displayed,
            caption: s
          });
        }
      });
      resolve(this._items); // Готово
    });
  }

  _items: Array<any> = null;
  public get items(): Array<any> {
    if (this._items === null) {
      this._items = [];
      // Заполним и обновим еще раз
      setTimeout(() => {
        this.getItems().then(items => this.grid.updateData());
      }, 50);
    }
    return this._items;
  }

  // Переключение в режим выбора Items и обратно
  toggleMode(e: any) {
    e.preventDefault();
    this.selectMode = !this.selectMode;
  }

  constructor(
    protected intl: InternationalizationService) {
    super(intl);
  }
}
