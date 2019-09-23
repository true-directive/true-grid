/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NgModule, Component, Input, Output, ElementRef, ViewChild,
         EventEmitter, Inject } from '@angular/core';

import { BaseComponent } from './base.component';
import { GridStateService } from './grid-state.service';
import { ColumnType, GridPart } from '@true-directive/base';
import { SortType } from '@true-directive/base';
import { Column } from '@true-directive/base';

@Component({
  selector: 'true-grid-header-cell',
  templateUrl: './grid-header-cell.component.html',
  host: {
    'class': 'true-header-cell'
  },
  styleUrls: ['./styles/grid-header-cell.behavior.scss']
})
export class GridHeaderCellComponent extends BaseComponent {

  @Input('column')
  public column: Column;

  @Output('toggleCheckColumn')
  toggleCheckColumn = new EventEmitter<any>();

  @Output('captionMouseDown')
  captionMouseDown = new EventEmitter<any>();

  @Output('captionMouseUp')
  captionMouseUp = new EventEmitter<any>();

  @Output('captionTouchStart')
  captionTouchStart = new EventEmitter<any>();

  //@Output('captionTouchEnd')
  //captionTouchEnd = new EventEmitter<any>();

  @ViewChild('caption')
  caption: any;

  @ViewChild('btn')
  btn: any;

  // Иконка фильтра
  // Если фильтр включен, то иконка кнопки показывается всегда и подсвечивается
  isFiltered(): boolean {
    return this.state.dataSource.getFilter(this.column) != null;
  }

  public setState(s: string) {
    if (s === 'btn-visible')
      this.caption.nativeElement.classList.add('true-grid-btn-visible');
  }

  public removeState(s: string) {
    if (s === 'btn-visible')
      this.caption.nativeElement.classList.remove('true-grid-btn-visible');
  }

  btnIconClass() {
    let classes = '';
    if (this.isFiltered()) {
      classes += this.state.sta.filterBtnIconClass_active;
    } else {
      classes += this.state.sta.filterBtnIconClass;
    }
    return classes;
  }

  // Отсортирована ли колонка
  public isSorted(col: Column): boolean {
    return this.sorted !== null;
  }

  public get sorted(): SortType {
    const res = this.state.dataSource.sortedByField(this.column.fieldName);
    return !res ? null : res.sortType;
  }

  public get sortedUp(): boolean {
    return this.sorted === SortType.ASC;
  }

  public get sortedDown(): boolean {
    return this.sorted === SortType.DESC;
  }

  // Если отсортирован, то как?..
  sortIndicatorClass() {

    if (this.sortedUp) {
      return this.state.sta.sortedUpIconClass;
    }

    if (this.sortedDown) {
      return this.state.sta.sortedDownIconClass;
    }

    return '';
  }

  toggleCheck(e: any) {
    this.toggleCheckColumn.emit(e);
  }

  headerMouseDown(e: any) {
    e.stopPropagation();
  }

  mouseDown(e: any) {
    this.captionMouseDown.emit(e);
  }

  mouseUp(e: any) {
    this.captionMouseUp.emit(e);
  }

  touchStart(e: any) {
    this.captionTouchStart.emit(e);
  }

  contextMenu(e: any) {
    this.state.headerContextMenu(e, this.column);
  }

  // Клик по кнопке фильтра
  btnTouch(e: any) {
    this.state.showFilter(e, this.column);
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  // Клик по кнопке фильтра
  btnClick(e: any) {
    this.state.showFilter(e, this.column);
  }

  // Прерываем MouseDown, чтобы не произошло сортировки
  btnMouseDown(e: any) {
    e.stopPropagation();
    e.preventDefault();
  }

  ngAfterContentInit() {
    this.addTouchListeners(this.caption.nativeElement);
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    public elementRef: ElementRef) {
      super();
    }
}
