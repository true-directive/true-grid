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
import { Dates } from '@true-directive/base';
import { Utils, PopupPosition } from '@true-directive/base';

import { MenuComponent } from '../../controls/menu.component';
import { FilterBaseComponent } from './filter-base.component';
import { DropdownBaseComponent } from '../../controls/dropdown-base.component';
import { InternationalizationService } from '../../internationalization/internationalization.service';

@Component({
  selector: 'true-filter-date',
  templateUrl: 'filter-date.component.html',
  styleUrls: ['filter-date.component.scss']
  })
export class FilterDateComponent extends FilterBaseComponent {

  // Weeks
  private get curWeek1() {
    return Dates.firstDateOfWeek(Dates.today(), this.intl.locale.firstDayOfWeek);
  }

  private get curWeek2() {
    return Dates.lastDateOfWeek(Dates.today(), this.intl.locale.firstDayOfWeek);
  }

  private get prevWeek2() {
    return Dates.lastDateOfPrevWeek(Dates.today(), this.intl.locale.firstDayOfWeek);
  }

  private get prevWeek1() {
    return Dates.firstDateOfWeek(this.prevWeek2, this.intl.locale.firstDayOfWeek);
  }

  // Months
  private get curMonth1() {
    return Dates.firstDateOfMonth(Dates.today());
  }

  private get curMonth2() {
    return Dates.lastDateOfMonth(Dates.today());
  }

  private get prevMonth2() {
    return Dates.lastDateOfPrevMonth(Dates.today());
  }

  private get prevMonth1() {
    return Dates.firstDateOfPrevMonth(Dates.today());
  }

  get currentInterval(): number {
    let res = null;
    if (Dates.equals(Dates.today(), this.filter.value) && Dates.equals(this.filter.value, this.filter.value2))
      res = 0;
    if (Dates.equals(Dates.yesterday(), this.filter.value) && Dates.equals(this.filter.value, this.filter.value2))
      res = 1;
    if (Dates.equals(this.curWeek1, this.filter.value) && Dates.equals(this.curWeek2, this.filter.value2))
      res = 2;
    if (Dates.equals(this.prevWeek1, this.filter.value) && Dates.equals(this.prevWeek2, this.filter.value2))
      res = 3;
    if (Dates.equals(this.curMonth1, this.filter.value) && Dates.equals(this.curMonth2, this.filter.value2))
      res = 4;
    if (Dates.equals(this.prevMonth1, this.filter.value) && Dates.equals(this.prevMonth2, this.filter.value2))
      res = 5;
    return res;
  }

  set currentInterval(v: number) {
    switch(v) {
      case 0:
        this.filter.value = Dates.today();
        this.filter.value2 = Dates.today();
        break;
      case 1:
        this.filter.value = Dates.yesterday();
        this.filter.value2 = Dates.yesterday();
        break;
      case 2:
        this.filter.value = this.curWeek1;
        this.filter.value2 = this.curWeek2;
        break;
      case 3:
        this.filter.value = this.prevWeek1;
        this.filter.value2 = this.prevWeek2;
        break;
      case 4:
        this.filter.value = this.curMonth1;
        this.filter.value2 = this.curMonth2;
        break;
      case 5:
        this.filter.value = this.prevMonth1;
        this.filter.value2 = this.prevMonth2;
        break;
    }
  }

  // Ошибка пользовательского ввода
  inputError1: string = '';
  inputError2: string = '';

  // IFilter implementation
  // Initialization
  public init() {
    //
  }

  // Validation
  public validate(): boolean {

    this.inputError1 = '';
    this.inputError2 = '';

    // Чистим список значений в фильтре
    this.filter.items.splice(0, this.filter.items.length);

    if (this.filter.value === null) {
      this.inputError1 = 'Enter first date';
    }

    if (this.filter.value2 === null) {
      this.inputError2 = 'Enter second date';
    }

    if (this.inputError1 != '' || this.inputError2 != '') {
      return false;
    }

    return true;
  }

  operators = [
    FilterOperator.BETWEEN,
    FilterOperator.NOT_BETWEEN
  ];

  intervals = [
    {id: 0, name: this.intl.translate('Today') },
    {id: 1, name: this.intl.translate('Yesterday') },
    {id: 2, name: this.intl.translate('This week') },
    {id: 3, name: this.intl.translate('Last week') },
    {id: 4, name: this.intl.translate('This month') },
    {id: 5, name: this.intl.translate('Last month') }
  ];

  intervalColumns = [
    new Column('name', 'Interval name', 16, ColumnType.STRING)
  ];

  private _intervalSettings: GridSettings = null;

  get intervalSettings() {
    if (!this._intervalSettings) {
      this._intervalSettings = GridSettings.minimal();

      this._intervalSettings.rowHeight = this.state.st.filterItemRowHeight;
      this._intervalSettings.widthUnit = 'em';
      this._intervalSettings.showHeader = false;
      this._intervalSettings.columnAutoWidth = false;
      this._intervalSettings.dataWordWrap = false;
      this._intervalSettings.appearance.enableHoverAppearance = true;

      if (this.state !== null) {
        this._intervalSettings.appearance.class = this.state.settings.appearance.class;
        this._intervalSettings.appearance.scrollboxClass = this.state.settings.appearance.scrollboxClass;
      }

    }
    return this._intervalSettings;
  }

  @ViewChild('datepicker1') datepicker1: any;
  @ViewChild('datepicker2') datepicker2: any;
  @ViewChild('intervalSelector') intervalSelector: DropdownBaseComponent;

  protected focusFirst() {
    if (!Utils.detectMobile()) {
      setTimeout(() => this.datepicker1.focus());
    }
  }

  ngAfterContentInit() {
    this.focusFirst();
  }

  constructor(protected intl: InternationalizationService) {
    super(intl);
  }
}
