/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NgModule, Component, Input, Output, ElementRef, ViewChild,
         ChangeDetectorRef, Inject,
         EventEmitter } from '@angular/core';

import { GridStateService } from './grid-state.service';
import { InternationalizationService } from './internationalization/internationalization.service';
import { ColumnType } from '@true-directive/base';
import { SummaryType, Summary } from '@true-directive/base';
import { Column } from '@true-directive/base';

@Component({
  selector: 'true-grid-footer-cell',
  templateUrl: './grid-footer-cell.component.html',
  styleUrls: ['./styles/grid-footer-cell.behavior.scss'],
  host: {
    '[class.num]': 'column.isNumeric',
    '[class.h100]': 'column.summaries.length<=1'
  }
})
export class GridFooterCellComponent {

  _currentSummary: Summary = null;

  readonly summaryTypes = [
    SummaryType.SUM, SummaryType.MIN, SummaryType.MAX,
    SummaryType.COUNT, SummaryType.AVERAGE
  ];

  public displayedValue(a: Summary): string {
    if (a.type != SummaryType.COUNT && this.column.format != '') {
      return this.state.dataSource.displayedValue(this.column, a.value, null);
    }
    return a.value;
  }

  public canApply(t: SummaryType): boolean {
    if (t === SummaryType.SUM || t === SummaryType.AVERAGE) {
      return this.column.type === ColumnType.NUMBER;
    }
    return true;
  }

  public hasAggr(t: SummaryType): boolean {
    return this._currentSummary != null && this._currentSummary.type === t;
  }

  @Input('column')
  public column: Column;

  @ViewChild('btn', {static: false})
  btn: any;

  @ViewChild('menu', {static: false})
  menu: any;

  get menuVisible() {
    return this.menu.visible;
  }

  menuClosed(e: any) {
    this.elementRef.nativeElement.classList.remove('true-grid-btn-visible');
  }

  menuShow(e: any) {
    this.elementRef.nativeElement.classList.add('true-grid-btn-visible');
  }

  setAggr(t: SummaryType) {
    this.state.setSummary(this.column, t, this._currentSummary);
  }

  addAggr(e: any, t: SummaryType) {
    this.state.addSummary(this.column, t);
  }

  toggleMenu(e: any, a: Summary = null) {

    let l = e.target.tagName === 'SPAN' ? e.target.parentElement : e.target;
    if (l.parentElement !== this.elementRef.nativeElement) {
      l = l.parentElement;
    }

    if (this.menuVisible) {
      this.menu.closePopup();
    } else {
      this._currentSummary = a;
      this.menu.showByTarget(l, this.column.isNumeric ? 'AboveLeft' : 'AboveRight');
      this.changeDetector.detectChanges();
    }
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    public intl: InternationalizationService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef) { }
}
