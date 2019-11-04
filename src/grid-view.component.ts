/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/*
  View only. Missing features:
    - Checkboxes.
    - Editing.
    - Selection.
 */
import { Component, Input, Output, ViewChild, ViewChildren, ContentChildren,
         ElementRef, QueryList, ChangeDetectorRef,  KeyValueDiffer,
         KeyValueDiffers, EventEmitter, Inject,
         DoCheck, OnDestroy
       } from '@angular/core';

import { Subject, Observable, Subscription } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

import { GridPart, RenderMode, DetectionMode, ColumnType } from '@true-directive/base';
import { UIActionType, UIAction } from '@true-directive/base';
import { Column, ColumnBand, CellPosition, GridSettings, RowLayout, DataQuery,
         SortInfo, SortType, Filter, Selection, MenuAction } from '@true-directive/base';
import { PagePipe } from '@true-directive/base';
import { RowCalculator } from '@true-directive/base';

import { ScrollerComponent } from './scroller.component';
import { BaseComponent } from './base.component';
import { GridHeaderComponent } from './grid-header.component';

import { RowDirective } from './row.directive';

import { GridStateService } from './grid-state.service';
import { InternationalizationService } from './internationalization/internationalization.service';

import { FilterTextComponent } from './filters/datatypes/filter-text.component';
import { FilterDateComponent } from './filters/datatypes/filter-date.component';
import { FilterNumberComponent } from './filters/datatypes/filter-number.component';
import { FilterBooleanComponent } from './filters/datatypes/filter-boolean.component';

import { FilterPopupComponent } from './filters/filter-popup.component';

import { MenuStarterComponent } from './controls/menu-starter.component';

@Component({
  selector: 'true-grid-view',
  templateUrl: './grid-view.component.html',
  providers: [{ provide: 'gridState', useClass: GridStateService }],
  styleUrls: [
              // These styles define the layout and behavior of the component
              './styles/grid.behavior.scss'
            ]
})
export class GridViewComponent extends BaseComponent implements DoCheck, OnDestroy {

  protected destroy$: Subject<boolean> = new Subject<boolean>();

  private _data: Observable<any[]> = null;
  private _dataSubscription: Subscription;

  /**
   * Grid data source. You can specify an observable object or array.
   */
  @Input('data')
  public set data(ds: any[] | Observable<any[]>) {
    // Unsubscribe from previous source
    if (this._data !== null && ds === this._data) {
      return;
    }

    if (this._data !== null) {
      this._dataSubscription.unsubscribe();
      this._data = null;
    }

    if (ds instanceof Observable) {
      // Subscribe for new data
      this._data = ds;
      this._dataSubscription = this._data
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
        this.state.model = data;
        this.updateData();
      });
    } else {
      // Just array
      if (this.state.model !== ds) {
        this.state.model = ds;
        if (this._initialized) {
          this.updateData();
        }
      }
    }
  }

  /**
   * Data source
   * @return Array of the rows or observable object
   */
  public get data(): any[] | Observable<any[]> {
    return this._data !== null ? this._data : this.state.model;
  }

  /**
   * List of the rows to display
   * @return Array of the rows
   */
  public get rows(): any[] {
    return this.state.model;
  }

  /**
   * Resulting list of rows after applying filters and sorting
   * @return Array of the rows
   */
  public get resultRows(): any[] {
    return this.state.dataSource.resultRows;
  }

  /**
   * Current locale name
   */
  public get locale(): string {
    return this.intl.currentLocaleName;
  }

  /**
   * List of the columns
   */
  @Input('columns')
  public set columns(v: Column[]) {
    this.state.columns = v;
  }

  public get columns() {
    return this.state.columns;
  }

  /**
   * Grid's settings
   */
  @Input('settings')
  public set settings(v: GridSettings) {
    this.state.settings = v;
  }

  public get settings() {
    return this.state.settings;
  }

  /**
   * The maximum grid height, unless explicitly specified.
   */
  @Input('maxHeight')
  public maxHeight: number = null;

  /**
   * Text search data for all columns
   */
  @Input('searchString')
  get searchString() {
    return this.state.dataSource.searchString;
  }

  set searchString(v: string) {
    if (this.state.dataSource.searchString !== v) {
      this.state.dataSource.searchString = v;
      // A pause is necessary so that when printing quickly, do not perform
      // too frequent updates.
      setTimeout(() => {
        if (this.state.dataSource.searchString === v) {
          this.updateData();
        }
      }, this.state.settings.searchDelay);
    }
  }

  /**
   * Event that will trigger when data retrieval options are changed (filters,
   * sortings)
   * @param  'dataQuery' [description]
   * @return             [description]
   */
  @Output('dataQuery')
  dataQuery: EventEmitter<DataQuery> = new EventEmitter<DataQuery>();

  @Output('queryChanged')
  queryChanged: EventEmitter<DataQuery> = new EventEmitter<DataQuery>();

  @Output()
  startProcess: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  endProcess: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  headerContextMenu: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('menuStarter') menuStarter: MenuStarterComponent;
  @ViewChild('filterPopup') filterPopup: FilterPopupComponent; // Popup div with filter options

  @ViewChild('scroller') scroller: ScrollerComponent;

  @ViewChild('grid') grid: any;
  @ViewChild('gridHeader') gridHeader: any;
  @ViewChild('gridData') gridData: any;

  @ViewChild('dragItem') dragItem : any; // Clone drag column / band header

  @ContentChildren(RowDirective) displayedRows_template: QueryList<RowDirective>;

  @ViewChildren('displayedRows', { read: RowDirective }) displayedRowsCenter: QueryList<RowDirective>;

  @ViewChild('customTemplate') customTemplate: any;

  protected uiAction: UIAction = null;
  protected _initialized: boolean = false; // Grid initialized
  private _viewInitialized: boolean = false; // View initialized
  private _lastUpdateTime: number = 0; // Last page refresh time

  // Position and time of last scroll
  protected readonly _lastScroll = { pos: -1, renderedPos: -1, time: 0 };

  public dataUpdating = false; // Updating data in progress

  get displayedRows() {
    if (this.state.settings.customTemplate) {
      return this.displayedRows_template;
    }
    return this.displayedRowsCenter;
  }

  // Page processing required
  protected need_recalc_page = true;

  private _prevOffset = -1;
  private _prevLimit = -1;

  /**
   * Current appearance css-class
   */
  private _currentAppearance = '';

  /**
   * List of rows to be rendered.
   */
  private _currentRendered: any[] = [];

  // Settings differ
  private _settingsDiffer: KeyValueDiffer<any, any>;

  // Appearance settings differ
  private _appearanceDiffer: KeyValueDiffer<any, any>;

  public viewPortLeft = -1;
  public viewPortWidth = -1;

  public RC: RowCalculator = new RowCalculator(this.state);

  public get selection(): Selection {
    return this.state.selection;
  }

  protected get headerParts(): BaseComponent[] {
    return this._headerParts();
  }

  protected get dataParts(): Array<QueryList<RowDirective>> {
    return this._dataParts();
  }

  protected _headerParts(): BaseComponent[] {
    return [this.gridHeader];
  }

  protected _dataParts(): Array<QueryList<RowDirective>> {
    return [this.displayedRowsCenter];
  }

  public immediateFilter(filter: string) {
    this.state.dataSource.searchString = filter;
    this.updateData();
  }

  /**
   * List of the rows to render
   * @return Array of the rows
   */
  public get visibleRows(): any[] {

    if (!this.state.dataSource.resultRows) {
      return [];
    }

    if (this._prevOffset !== this.state.pageInfo.offset ||
        this._prevLimit !== this.state.pageInfo.limit ||
        this.need_recalc_page) {
      // Page refresh
      const toRender: any[] = new PagePipe().transform(this.state.dataSource.resultRows, this.state.pageInfo);
      this._prevOffset = this.state.pageInfo.offset;
      this._prevLimit = this.state.pageInfo.limit;
      this._currentRendered = toRender;
      this.need_recalc_page = false;
      // Important!
      this.state.displayedStartIndex = this.state.pageInfo.offset;
    }

    return this._currentRendered;
  }

  // Keeping the height of all rows
  private saveRowHeights() {
    this.displayedRowsCenter.forEach(el => {
      let hh: number;
      if (this.state.IE) {
        hh = el.elementRef.nativeElement.getBoundingClientRect().height;
      } else {
        hh = el.elementRef.nativeElement.clientHeight;
      }
      this.RC.setRowHeight(this.state.dataSource.resultRowCount, el.axI + this.state.pageInfo.offset, hh);
    });
  }

  /**
   * Page refresh
   * @param  forceChanges Force update even if there was no scrolling
   * @param  overwork     The number of rows that will be rendered outside the viewport
   */
  public updatePage(log: string = '', forceChanges: boolean = false, overwork: any = null) {
    if (this.viewPortLeft !== this.scroller.scrollLeft || this.viewPortWidth !==  this.scroller.viewPortWidth) {
      this.viewPortLeft = this.scroller.scrollLeft;
      this.viewPortWidth =  this.scroller.viewPortWidth;
      forceChanges = true;
    }

    if (!forceChanges) {
      this.saveRowHeights();
    }

    const pageChanged = this.RC.updateRenderInfo(
      this.state.dataSource.resultRowCount,
      this.scroller.scrollTop,
      this.scroller.viewPortHeight,
      overwork);

    if (forceChanges || pageChanged) {
      this.detectChanges('page');
    }
  }

  /**
   * Force view update
   */
  public updateView() {
    // First we need to update all view parameters
    this.detectChanges('view');
    this.state.updateLayouts();
    // Then the current page. Because its calculation depends on these parameters
    this.updatePage('updateView', true);
  }

  public cellPosition(row: any, fieldName: string): CellPosition {
    const ri = this.resultRows.indexOf(row);
    return new CellPosition(row, ri, fieldName);
  }

  public startSelect(cp: CellPosition, add: boolean = false) {
    this.state.startSelect(cp, add);
  }

  public proceedToSelect(cp: CellPosition) {
    this.state.proceedToSelect(cp);
  }

  /**
   * Hide all buttons in column headers
   */
  public hideHeaderBtns() {
    this.headerParts.forEach(p => {
      p.hideHeaderBtns();
    });
  }

  /**
   * Asynchronous data update. The Observable returns, by subscribing to which
   * you can find out when this update ended.
   * @param  data The data (array of objects).
   * @return      Observable object whose event will occur immediately after processing.
   */
  public updateDataAsync(data: any[]): Observable<any> {
    this.data = data;
    this.startProcess.emit('DataUpdate');
    this.elementRef.nativeElement.classList.add('processing');
    const subj = this.state.updateDataAsync();
    subj.subscribe(e => {
      this.endProcess.emit('DataUpdate');
    })
    return subj;
  }

  /**
   * Updating data with external or internal change.
   */
  public updateData(async: boolean = true) {

    if (!this._initialized) {
      async = false;
    }

    // The changes are serious. Row heights update.
    this.RC.clear();

    // Through a timeout, so that when the filter is applied, the button does
    // not have time to turn off before it is shown with an accent color
    setTimeout(() => this.hideHeaderBtns());

    if (async) {
      this.startProcess.emit('DataUpdate');
      this.elementRef.nativeElement.classList.add('processing');
      setTimeout(() => {
        this.state.updateData();
        this.endProcess.emit('DataUpdate');
      }, 1);
    } else {
      this.state.updateData(async);
    }
  }

  public updateSummaries() {
    this.state.updateSummaries();
    this.updateView();
  }

  /**
   * Received data externally (from the parent component)
   * @param  query The request in response to which the data received.
   * @param  data  Data that received in response to a given request.
   */
  public fetchData(query: DataQuery, data: any[]) {
    this.state.fetchData(query, data);
  }

  protected renderData() {

    this.dataUpdating = false;
    this.elementRef.nativeElement.classList.remove('processing');

    this.need_recalc_page = true;
    // Sent for further processing (aggregation, grouping)

    // Refreshing page with forced detectChanges
    this.updatePage('renderData', true);

    // After adding data, the width of the client part of the grid may change
    // due to the appearance of a scrollbar. Therefore, check the width of the grid.
    if (this.state.settings.columnAutoWidth) {
      this.checkSize();
    }

    // The height of the data changed, but the scroll position does not.
    // Therefore, scroll the related parts.
    this.scroller.scrollParts();
  }

  private _inProcess = false;

  protected updatePageByScroll() {
    this.updatePage('scroll', false);
    this._lastUpdateTime = Date.now();
  }

  protected fixScroll() {
    // Корректируем положение других блоков
  }

  /**
   * Scrolling data vertically
   * @param  e Scroll event
   */
  public gridScroll(e: any) {
    let scrollPos = e.target.scrollTop;
    let scrollPosH = e.target.scrollLeft;

    const dscrollH = scrollPosH - this.viewPortLeft;
    const dscroll = scrollPos - this._lastScroll.renderedPos;

    this._lastScroll.pos = scrollPos;

    this.RC.currentScrollPos = scrollPos;

    let needUpdate = false;

    if (Math.abs(dscroll) > this.RC.currentRH * 2) {
      // We have a stock of two lines. If the scroll is larger, then update.
      needUpdate = true;
    }

    if (Math.abs(dscrollH) > 1 && this.state.settings.renderMode === RenderMode.VISIBLE) {
      // When scrolling horizontally only if RenderMode.VISIBLE
      needUpdate = true;
    }

    if (!needUpdate) {
      // заменим на явное задание margin-top у
      this.fixScroll();
      return;
    }

    if (this._inProcess && this.state.iOS) {
      this.fixScroll();
      return;
    }

    if (scrollPos < 0 || scrollPos > (this.scroller.scrollHeight - this.scroller.viewPortHeight)) {
      this.fixScroll();
      return;
    }

    this._inProcess = true;

    const dt = Date.now();

    this._lastScroll.renderedPos = scrollPos;
    this._lastScroll.time = dt;

    const ms = dt - this._lastUpdateTime;
    let dms  = this.state.IE ? 40: 10;

    if (ms < dms && !this.state.iOS) {
      // Delaying
      const delay = dms * 4;
      setTimeout(() => {
        if (this._lastScroll.time === dt) {
          this.updatePageByScroll();
        }
      }, delay);
      this._inProcess = false;
      return;
    }

    this.updatePageByScroll();
    this._inProcess = false;
  }

  /**
   * Triggered by automatic scrolling during area selection
   * @param  dx How many pixels are scrolled horizontally?
   */
  public gridAutoScrollX(dx: number) {
    this.gridHeader.autoScrollX(dx);
  }

  /**
   * We need call this method for the changes to take effect.
   * If dataAffected=true then re-filter and re-sort data.
   * @param  log          Reason for detecting changes
   * @param  dataAffected Is the data changed
   */
  public detectChanges(log: string = '', dataAffected: boolean = false) {
    if (dataAffected) {
      this.updateData();
      return;
    }

    if (this.state.settings.changeDetectionMode === DetectionMode.MANUAL) {
      // Otherwise, it will check the changes. And we won’t pull the detector again..
      this.changeDetector.detectChanges();
    }
  }

  protected displayedRowsByXY(x: number, y: number, place: GridPart = null): QueryList<RowDirective> {
    return this.displayedRows;
  }

  protected rowLayouts(rows: QueryList<RowDirective>): RowLayout[] {

    const result: RowLayout[] = [];
    const firstRow = rows.first;
    if (!firstRow) {
      return result;
    }

    let ri = this.state.pageInfo.offset;

    rows.forEach(el => {
      const rl = new RowLayout();
      rl.index = ri;
      rl.rowComponent = el;
      rl.clientRect = el.elementRef.nativeElement.getBoundingClientRect();
      result.push(rl);
      ri++;
    });

    return result;
  }

  protected rowByXY(rows: QueryList<RowDirective>, x: number, y: number): RowLayout {
    return RowLayout.rowByXY(this.rowLayouts(rows), x, y);
  }

  protected cellByXY(x: number, y:number, place: GridPart = null): CellPosition {
    const rows = this.displayedRowsByXY(x, y, place);
    const r = this.rowByXY(rows, x, y);
    if (r && r.rowComponent) {
      return this.state.cellPosition(r.rowComponent.row, r.index, r.rowComponent.cellByXY(x, y));
    }
    return null;
  }

  // Перерисовка выделенного
  protected refreshSelection(scrollTo: CellPosition) {
    this.dataParts.forEach(p =>
      p && p.forEach(el => el.setSelection())
    );
    if (scrollTo) {
      this.scrollTo(scrollTo);
    }
  }

  /**
   * Прокрутить скроллбоксы так, чтобы была видна ячейка, на которой находится
   * виртуальный фокус
   */
  public scrollToFocused() {
    if (this.state.focusedCell) {
      this.scrollTo(this.state.focusedCell);
    }
  }

  /**
   * Прокрутка к указанной ячейке.
   * Обычно вызываем после обработки нажатия клавиши, чтобы была видна строка
   * с фокусом.
   * Также вызывается после клика мышью по ячейке.. Если ячейка видна на экране
   * только частично - немного скроллим.
   * @param  cellPos Позиция ячейки, к которой прокручиваем грид
   */
  public scrollTo(cellPos: CellPosition) {
    if (!cellPos) {
      return;
    }
    // Будем считать, что нам нужна только ячейка с фокусом
    // Сохраним высоты строк.. Т.к. они могут быть еще не сохранены,
    // если не случилось прокрутки
    this.saveRowHeights();
    let ri = cellPos.rowIndex;
    let fieldName = cellPos.fieldName;

    // сначала по вертикали
    let scrollTop = this.scroller.scrollTop;
    let scrollLeft = this.scroller.scrollLeft;
    let scrollAreaHeight = this.scroller.viewPortHeight;
    let scrollAreaWidth =  this.scroller.viewPortWidth;

    let rowTop = this.RC.getRowTop(ri);
    let rowBottom = rowTop + this.RC.getRowHeight(ri);

    if (rowTop < scrollTop) {
      this.scroller.scrollTo(-1, rowTop);
    } else {
      if (rowBottom > (scrollTop + scrollAreaHeight)) {
        this.scroller.scrollTo(-1, rowBottom - scrollAreaHeight);
      }
    }

    // Теперь по горизонтали
    // Возьмем строку
    this.displayedRowsCenter.some(row => {
      if (row.row === cellPos.row) {
        const hPos = row.cellHorizontalPos(fieldName);
        if (hPos && hPos.l < scrollLeft) {
          this.scroller.scrollTo(hPos.l);
        }
        if (hPos && hPos.r > scrollLeft + scrollAreaWidth) {
          this.scroller.scrollTo(hPos.r - scrollAreaWidth);
        }
        return true;
      }
      return false
    });
  }

  protected toggleClass(v: boolean, c: string) {
    if (v) {
      this.elementRef.nativeElement.classList.add(c);
    } else {
      this.elementRef.nativeElement.classList.remove(c);
    }
  }

  /**
   * Проверить, нужно ли отобразить левую или правую область для зафиксированных
   * колонок
   * @param  xx         [description]
   * @param  scrollRect [description]
   * @param  target     [description]
   * @return            [description]
   */
  protected checkParts(xx: number, scrollRect: any, target: any) {
    // Нечего проверять в этой реализации
  }

  /**
   * Выделение заданной строки
   * @param  r Заданная строка
   * @return   Найдена ли заданная строка в списке отображаемых строк
   */
  public locateRow(r: any): boolean {
    return this.state.locateRow(r);
  }

  /**
   * Выделение строки по заданному значению ключевого поля
   * @param  keyValue Значение ключевого поля
   * @param  keyField Ключевое поле. Если не задано, то поле берется из settings
   * @return          Найдена ли строка с заданным ключом
   */
  public locateByKey(keyValue: any, keyField: string = '') {
    this.state.locateByKey(keyValue, keyField);
  }

  /**
   * Очистка выделения
   */
  public clearSelection() {
    this.state.clearSelection();
  }

  /**
   * Трек отображаемых записей для более быстрого рендера ангуляром
   * @param  index Индекс строки
   * @param  data  Данные строки
   */
  public trackRow(index: number, data: any) {
    return data;
  }

  /**
   * При изменении размеров окна вызывается этот метод.
   * Если размер компонента изменяется какими-то действиями пользователя помимо
   * изменения размеров окна браузера (вьюпорта), то необходимо вызывать этот
   * метод.
   * Этот метод также следует вызывать при drop колонки, т.к. размер центральной
   * области меняется, если колонка переброшена в левую или правую фиксированную
   * область.
   * @param  update_page=false [description]
   * @return                   [description]
   */
  public checkSize(update_page = false): boolean {
    // Указываем ширину клиентской области.
    // Если она изменена, то в сеттере будет вызван updateLayouts

    if (this.state.checkClientWidth(this.scroller.viewPortWidth) ||
        this.state.checkClientHeight(this.scroller.viewPortHeight)) {
      this.need_recalc_page = true;
      if (this._initialized) {
        this.updatePage('checkSize', true);
      }
      return true;
    }

    if (update_page) {
      this.updatePage('checkSize2', true);
    }

    return false;
  }

  // Изменение размера окно
  protected windowResize(e: any) {
    this.checkSize(true);
  }

  /**
   * Показать кнопку заголовка для колонки по заданному полю
   * @param  fieldName Заданное поле
   */
  public showHeaderBtn(fieldName: string) {
    this.headerParts.forEach(p => {
      p.showHeaderBtn(fieldName);
    });
  }

  /**
   * Data sorting
   * @param  sortings List of sortings
   */
  public sort(sortings: SortInfo[], update: boolean = true) {
    this.state.sort(sortings, update);
  }

  public clearSorting(update: boolean = true) {
    this.state.sort([], update);
  }

  /**
   * Data filtering
   * @param  result [description]
   * @return        [description]
   */
  public filter(filters: Filter[], update: boolean = true) {
    this.state.filter(filters, update);
  }

  public filterToString(filter: Filter) {
    return filter.toString(this.intl, this.state.dataSource.valueFormatter);
  }

  public filterClosed(result: any) {
    if (!result) {
      this.hideHeaderBtns();
    }
  }

  public setFilter(f: any) {

    this.state.setFilter(f);
  }

  public resetFilter(f: any) {
    this.state.resetFilter(f);
  }

  protected getFilterComponentType(filter: Filter): any {
    let filterType: any = FilterTextComponent;

    if (filter.type === ColumnType.NUMBER) {
      filterType = FilterNumberComponent;
    }
    if (filter.type === ColumnType.DATETIME) {
      filterType = FilterDateComponent;
    }
    if (filter.type === ColumnType.BOOLEAN) {
      filterType = FilterBooleanComponent;
    }

    const col: Column = this.state.columnByFieldName(filter.fieldName);

    if (!col) {
      return null;
    }

    if (col.filterComponentType !== null) {
      filterType = col.filterComponentType;
    }
    return filterType;
  }

  protected showFilter(e: any) {
    this.menuStarter.finish();
    let l = e.target.tagName === 'SPAN' ? e.target.parentElement : e.target;

    if (this.filterPopup.visible) {
      if (this.filterPopup.filter.fieldName === e.filter.fieldName) {
        this.filterPopup.closePopup();
        return;
      } else {
        this.filterPopup.closePopup();
      }
    }

    this.hideHeaderBtns();
    this.showHeaderBtn(e.filter.fieldName);

    const filterType = this.getFilterComponentType(e.filter);

    if (filterType !== null) {
      setTimeout(() => {
        this.filterPopup.showByTarget(l, e.filter, filterType, this.state.model);
      }, 10);
    }
  }

  public focus() {
    this.scroller.focus();
  }

  /**
   * Установка класса внешнего вида
   * @param  appearanceClass Класс, который будет применен к компоненту
   */
  public setAppearance(appearanceClass: string) {

    if (appearanceClass === this._currentAppearance) {
      // Без изменений
      return;
    }

    if (this._currentAppearance !== '') {
      // Убираем добавленный
      this.elementRef.nativeElement.classList.remove(this._currentAppearance);
    }

    this.elementRef.nativeElement.classList.add(appearanceClass);
    this._currentAppearance = appearanceClass;
  }

  public menuItemClick(e: any) {
    const col = e.target;
    const action = e.action;

    if (action === MenuAction.SORT_ASC) {
      this.sort([new SortInfo(col.fieldName, SortType.ASC)]);
    }
    if (action === MenuAction.SORT_DESC) {
      this.sort([new SortInfo(col.fieldName, SortType.DESC)]);
    }
    if (action === MenuAction.HIDE) {
      this.state.hideColumn(col);
    }
  }

  ngOnInit() {
    // Отключаем детектор по настройке.
    // Без отключения всё работает, но много чего мелькает не вовремя..
    if (this.state.settings.changeDetectionMode === DetectionMode.MANUAL) {
      this.changeDetector.detach();
    }

    // Grid appearance
    this.setAppearance(this.state.sta.class);

    if (this.state.iOS || this.state.android) {
      this.elementRef.nativeElement.classList.add('true-fix-touch');
    }

    if (this.state.IE) {
      this.elementRef.nativeElement.classList.add('true-fix-ie');
    }

    this._settingsDiffer = this.keyValueDiffers.find(this.state.settings).create();
    this._appearanceDiffer = this.keyValueDiffers.find(this.state.settings.appearance).create();

    this._settingsDiffer.diff(this.state.settings);
    this._appearanceDiffer.diff(this.state.settings.appearance);

    this.updateData();
    this._initialized = true;
  }

  ngAfterContentInit() {
    //
  }

  ngAfterViewInit() {

    // Сохраняем ширину
    this.state.checkClientWidth(this.scroller.viewPortWidth);

    // На этот момент может быть неизвестна высота грида. Которая нам очень нужна!
    // Обычно это случается при сложной разметке, когда размер задан в процентах от
    // родительского элемента.
    let vh = this.scroller.viewPortHeight;
    if (vh <= this.state.settings.rowHeight) {
      // Это условие показывает, что что-то не так.
      // Мы немного отложим первый рендер данных.
      // Мы увидим белый экран перед тем как увидим данные.
      setTimeout(() => this.renderData());
    } else {
      // Будем оптимистами. Возможно, нас спасёт ngDoCheck
      this.renderData();
    }

    // Запоминаем текущую высоту вьюпорта
    this.state.checkClientHeight(vh)

    // Добавляем пассивные слушатели тач-событий
    this.addTouchListeners(this.gridData.nativeElement);

    // Следим за размером окна, чтобы дорендерить невидимые ранее данные
    this.addWindowResizeListener();
    this._viewInitialized = true;
  }

  protected doCheckParts() {
    // Обновляем изменение
    // Фильтры не виновaты, что у нас отключен детектор изменений
    if (this.filterPopup && this.filterPopup.visible) {
      // Поэтому даём знать об изменениях
      this.filterPopup.changes();
    }
  }

  ngDoCheck() {

    this.doCheckParts();

    // Сверяем настройки
    const sChanges = this._settingsDiffer.diff(this.state.settings);
    const aChanges = this._appearanceDiffer.diff(this.state.settings.appearance);
    if (sChanges || aChanges) {
      if (this._viewInitialized) {
        this.setAppearance(this.state.settings.appearance.class);
        if (!this.checkSize()) {
          this.updateView();
        }
        return;
      }
    }

    // Сверяем высоту грида. Это немного затормаживает нас.
    // Но дает гарантию, что данные будут вовремя отрисованы
    if (this.state.checkClientHeight(this.scroller.viewPortHeight)
        && this._viewInitialized) {
      this.updatePage();
    }
  }

  ngOnDestroy() {
    // Отписаться от событий
    this.destroy$.next(true);
    this.destroy$.unsubscribe();

    super.ngOnDestroy();
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    protected intl: InternationalizationService,
    protected elementRef: ElementRef,
    protected changeDetector: ChangeDetectorRef,
    protected keyValueDiffers: KeyValueDiffers) {

    super();

    // Locale was changed
    this.intl.onLocaleChanged.pipe(takeUntil(this.destroy$)).subscribe(l => {
        if (this._viewInitialized) {
          this.detectChanges('locale');
        }
      });

    // Запрос данных у слушателя события
    this.state.onDataQuery.pipe(takeUntil(this.destroy$)).subscribe(q => {
      this.dataUpdating = true;
      this.dataQuery.emit(q);
    });

    // Данные получены - отображаем
    this.state.onDataFetch.pipe(takeUntil(this.destroy$)).subscribe(e => {
      if (this._viewInitialized) {
        this.renderData();
      }
    });

    // Изменена структура
    this.state.onQueryChanged.pipe(takeUntil(this.destroy$)).subscribe(q => {
      if (this._initialized) {
        this.updateData();
      }
      this.queryChanged.emit(q);
    });

    // Следует отобразить окно фильтра для заданной колонки
    this.state.onFilterShow.pipe(takeUntil(this.destroy$)).subscribe(e => this.showFilter(e));

    // Изменение списка суммирований колонки
    this.state.onSummariesChanged.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.state.updateSummaries();
      this.updateView();
    });

    this.state.onHeaderContextMenu.pipe(takeUntil(this.destroy$)).subscribe(e => {
      if (this.state.settings.enableHeaderContextMenu) {
        const actions = this.state.settings.headerContextMenuActions;
        const sorted = this.state.dataSource.sortedByField(e.column.fieldName);
        if (actions.length > 0) {
          actions.forEach(a => {
            if (a === MenuAction.SORT_ASC) {
              a.disabled = sorted && sorted.sortType === SortType.ASC;
            }
            if (a === MenuAction.SORT_DESC) {
              a.disabled = sorted && sorted.sortType === SortType.DESC;
            }
          });
          this.menuStarter.start(e.event, this.state.settings.headerContextMenuActions, e.column);
          this.detectChanges();
          e.event.preventDefault();
        }
      }
      this.headerContextMenu.emit(e);
    });

  }
}
