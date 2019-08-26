/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, HostBinding, EventEmitter, ChangeDetectorRef,
         ElementRef, HostListener, ViewChild,
         ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Keys } from '@true-directive/base';
import { Dates } from '@true-directive/base';
import { InternationalizationService } from '../internationalization/internationalization.service';

/**
 * Calendar component.
 */
@Component({
  selector: 'true-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  host: {
    'class': 'true-calendar true-mode-days',
    '(mousedown)': 'mousedown($event)',
    '(touchend)': '$event.stopPropagation()'
  },
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarComponent),
      multi: true
    }]
  })
export class CalendarComponent implements ControlValueAccessor {

  private onChange = (_: any) => {};
  private onTouched = () => {};

  private _value: any = null;

  public mode: 'days' | 'months' | 'years' = 'days';

  @ViewChild('days')
  days: any;

  @Output('dateClick')
  dateClick: EventEmitter<any> = new EventEmitter<any>();

  @Output('escape')
  escape: EventEmitter<any> = new EventEmitter<any>();

  private calendarDateStart: any;
  private calendarDateEnd: any;


  get value(): any {
    return this._value;
  }

  set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.createWeeks(this._value);
      this.onChange(v);
    }
  }

  get valueTime(): number {
    let vTime = 0;
    if (this.value !== null && !isNaN(this.value.getTime())) {
      vTime = this.value.getTime();
    }
    return vTime;
  }

  get monthYear() {

    const m = this.calendarDateStart.getMonth();
    const y = this.calendarDateStart.getFullYear();

    if (this.mode === 'days') {
      return this.intl.locale.longMonthNames[m] + ' ' + y;
    }

    if (this.mode === 'months') {
      return y;
    }

    if (this. mode === 'years') {
      return this._minYear + ' - ' + this._maxYear;
    }
  }

  get today() {
    return Dates.today();
  }

  registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  blur() {
    this.onTouched();
  }

  // Отображаем значение в компоненте. Formatter: Ctrl --> View
  writeValue(value: any): void {
    if (this.value !== value) {
      this.value = value;
    }
  }

  setFocus() {
    this.days.nativeElement.focus();
  }

  isCurrentMonth(d: any) {
    return Dates.dateBetween(d, this.calendarDateStart, this.calendarDateEnd);
  }

  go(qty: number) {
    if (this.mode === 'days') {
      let newDate;
      if (qty > 0 ) {
        newDate = Dates.firstDateOfNextMonth(this.calendarDateStart);
      } else {
        newDate = Dates.firstDateOfPrevMonth(this.calendarDateStart);
      }

      this.createWeeks(newDate);
    }

    if (this.mode === 'months') {
      this.calendarDateStart = new Date(this.calendarDateStart.getFullYear() + qty, 0, 1);
      this.createMonths();
    }

    if (this.mode === 'years') {
      this.calendarDateStart = new Date(this.calendarDateStart.getFullYear() + 24 * qty, 0, 1);
      this.createYears();
    }
  }

  toggleMode() {

    if (this.mode === 'years') {
      this.mode = 'days';
      this.createWeeks(this.calendarDateStart);
    } else {
      if (this.mode === 'months') {
        this.mode = 'years';
        this.createYears();
      } else {
        if (this.mode === 'days') {
          this.mode = 'months';
          this.createMonths();
        }
      }
    }

    this.setMode();
  }

  setMode() {
    this.el.nativeElement.classList.remove('true-mode-days');
    this.el.nativeElement.classList.remove('true-mode-months');
    this.el.nativeElement.classList.remove('true-mode-years');
    this.el.nativeElement.classList.add('true-mode-' + this.mode);
  }

  mousedown(e: any) {
    e.stopPropagation();
  }

  calendarDateClick(e: any, d: any) {
    if (this.mode === 'days') {
      this.value = new Date(d);
      this.dateClick.emit(d);
    }

    if (this.mode === 'months') {
      this.mode = 'days';
      this.createWeeks(new Date(d));
    }

    if (this.mode === 'years') {
      this.calendarDateStart = new Date(d);
      this.mode = 'months';
      this.createMonths();
    }

    this.setMode();

    e.preventDefault();
    e.stopPropagation();
  }

  // Day names
  dayNames: Array<string> = [];

  // Month weeks
  weeks: Array<any> = [];

  // Year months
  monthRows: Array<any> = [];

  // Matrix of displayed years
  yearRows: Array<any> = [];

  // List of dates in selected month
  private createDayNames() {
    this.dayNames = [];
    const weekStart = Dates.firstDateOfWeek(Dates.today(), this.intl.locale.firstDayOfWeek);
    const weekEnd = Dates.lastDateOfWeek(weekStart, this.intl.locale.firstDayOfWeek);

    for (let d = new Date(weekStart); d.getTime() <= weekEnd.getTime(); d = Dates.nextDate(d)) {
      const wd = d.getDay();
      const dayName = this.intl.locale.shortDayNames[wd];
      this.dayNames.push(dayName);
    }
  }

  // List of months to show in months-mode
  private createMonths() {

    const yy = this.calendarDateStart.getFullYear();
    const currentMonthStart = Dates.firstDateOfMonth(Dates.today());

    let k = -3;
    this.monthRows = [];
    for (let i = 0; i < 6; i++) {
      let monthRow = [];
      for (let j = 0; j < 3; j++) {

        // Month start
        const dd = new Date(yy, k, 1);

        monthRow.push(
          { name: this.intl.locale.shortMonthNames[dd.getMonth()] + ' ' + Dates.yearTwoDigits(dd),
            date: dd,
            selected: Dates.isSameMonth(dd, this.value),
            today: dd.getTime() === currentMonthStart.getTime(),
            current: Dates.isSameYear(dd, this.calendarDateStart) }
        );
        k++;
      }
      this.monthRows.push(monthRow);
    }
  }

  private _minYear = 0;
  private _maxYear = 0;

  // List of dates in selected month
  private createYears() {

    const yy = this.calendarDateStart.getFullYear();
    const currentYearStart = new Date(Dates.today().getFullYear(), 0, 1);
    const calendarYearStart = new Date(this.calendarDateStart.getFullYear(), 0, 1);

    this._minYear = yy - 11;
    let k = this._minYear;

    this.yearRows = [];
    for (let i = 0; i < 6; i++) {
      let yearRow = [];
      for (let j = 0; j < 4; j++) {

        const dd = new Date(k, 0, 1);
        yearRow.push(
          { name: k + '',
            date: dd,
            selected: Dates.isSameYear(dd, this.value),
            today: dd.getTime() === currentYearStart.getTime(),
            current: true }
        );

        k++;
      }
      this.yearRows.push(yearRow);
    }

    this._maxYear = k - 1;
  }

  private createWeeks(date: any) {

    if (date === null || isNaN(date.getTime())) {
      date = Dates.today();
    }

    const firstDayOfWeek = this.intl.locale.firstDayOfWeek;

    const monthStart = Dates.firstDateOfMonth(date);
    const monthEnd = Dates.lastDateOfMonth(date);

    if (this.weeks.length > 0
      && this.calendarDateStart !== undefined && this.calendarDateStart.getTime() === monthStart.getTime()
      && this.calendarDateEnd !== undefined && this.calendarDateEnd.getTime() === monthEnd.getTime()
    ) {
      return;
    }

    this.weeks = [];
    this.calendarDateStart = monthStart;
    this.calendarDateEnd = monthEnd;

    const calendarStart = Dates.firstDateOfWeek(monthStart, firstDayOfWeek);

    // Iterating weeks of month
    let weekStart = new Date(calendarStart);
    let wCounter = 0;
    while (wCounter < 6) {

      let week: Array<any> = [];
      let weekEnd = Dates.lastDateOfWeek(weekStart, firstDayOfWeek);

      // Iterating days of week
      for (let d = new Date(weekStart); d.getTime() <= weekEnd.getTime(); d = Dates.nextDate(d)) {
        week.push(d);
      }

      this.weeks.push(week);
      // Next week
      weekStart = Dates.nextDate(weekEnd);
      wCounter++;
    }
  }

  daysKeyDown(e: any) {

    let dd = 0;

    if (e.keyCode === Keys.LEFT) {
      dd = -1;
    }

    if (e.keyCode === Keys.UP) {
      dd = -7;
    }

    if (e.keyCode === Keys.RIGHT) {
      dd = 1;
    }

    if (e.keyCode === Keys.DOWN) {
      dd = 7;
    }

    if (e.keyCode === Keys.ENTER) {
      this.dateClick.emit(this.value);
      e.stopPropagation();
    }

    if (e.keyCode === Keys.ESCAPE) {
      this.escape.emit(this.value);
      e.stopPropagation();
    }

    if (dd !== 0) {
      this.value = Dates.addDays(this.value === null ? Dates.today() : this.value, dd);
      e.stopPropagation();
    }
  }

  ngOnInit() {
    this.createDayNames();
    this.createWeeks(Dates.today());
  }

  constructor(
    private intl: InternationalizationService,
    private cd: ChangeDetectorRef,
    private el: ElementRef
  ) { }
}
