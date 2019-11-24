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

import { DialogInfo } from '../../controls/dialog-info.class';

import { MenuComponent } from '../../controls/menu.component';
import { IFilter } from './filter.interface';

import { InternationalizationService } from '../../internationalization/internationalization.service';

export abstract class FilterBaseComponent implements IFilter {

  @Input() filter: Filter = null;
  @Input() rows: Array<any> = null;
  public state: GridState;

  @ViewChild('operatorMenu') operatorMenu: MenuComponent;

  @Output() closed: EventEmitter<any> = new EventEmitter();
  @Output() setFilter: EventEmitter<any> = new EventEmitter();
  @Output() resetFilter: EventEmitter<any> = new EventEmitter();

  public abstract init(): void;
  public abstract validate(): boolean;

  _dialog: DialogInfo = null;
  get dialog(): DialogInfo {
    if (this._dialog === null) {
      this._dialog = DialogInfo
        .new()
        .header(this.intl.translate(this.filter.caption))
        .button('set', this.intl.translate('SET'), 'primary')
        .button('reset', this.intl.translate('Reset'), 'primary outline', !this.filter.active);
    }
    return this._dialog;
  }

  public dialogBtnClick(e: any) {

    if (e.id === 'set') {
      if (this.validate()) {
        this.setFilter.emit(this.filter);
      }
    }

    if (e.id === 'reset') {
      this.resetFilter.emit(this.filter);
    }

    this.closed.emit(e);
  }

  // Настройки грида для списка значений
  private _settings: GridSettings = null;
  get listSettings() {

    if (!this._settings)
    {
      let o = GridSettings.minimal();
      // По умолчанию группы свёрнуты
      o.groupCollapseByDefault = true;
      // Такой отступ для групп
      o.levelIndent = 30;
      // Подгоняем ширину колонок под размер окна
      o.columnAutoWidth = true;
      // Высота строки из настроек
      o.rowHeight = this.state.settings.filterItemRowHeight;
      // Отмечаем кликом по ячейке, чтобы не целиться в маленький чекбокс
      o.checkByCellClick = true;

      o.appearance.class = this.state.settings.appearance.class;
      o.appearance.scrollboxClass = this.state.settings.appearance.scrollboxClass;

      this._settings = o;
    }
    return this._settings;
  }

  // Режим
  selectMode = false;

  // Открытие меню выбора оператора
  showOM(e: any) {
    if (!this.selectMode) {
      this.operatorMenu.position = 'ABSOLUTE';
      this.operatorMenu.togglePopup(e.target);
    }
    e.preventDefault();
  }

  // Установка оператора
  operator(o: FilterOperator) {
    this.filter.operator = o;
    this.validate();
  }

  constructor(protected intl: InternationalizationService) { }
}
