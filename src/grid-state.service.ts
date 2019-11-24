/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import { GridSelection } from './grid-selection.class';
import { InternationalizationService } from './internationalization/internationalization.service';

import { GridState, GridExporter } from '@true-directive/base';
import { Column } from '@true-directive/base';
import { CellPosition } from '@true-directive/base';
import { DataQuery } from '@true-directive/base';
import { CheckedChangedEvent, ValueChangedEvent, FilterShowEvent } from '@true-directive/base';
import { UIAction } from '@true-directive/base';
import { DOMUtils } from './common/dom-utils.class';

@Injectable()
export class GridStateService extends GridState implements OnDestroy {

  // -- EVENTS -----------------------------------------------------------------
  // Запрос данных у родителя
  protected _onDataQuery: Subject<DataQuery> = new Subject();
  public readonly onDataQuery: Observable<DataQuery> = this._onDataQuery.asObservable();

  // Получение данных от родителя
  protected _onDataFetch: Subject<void> = new Subject();
  public readonly onDataFetch: Observable<void> = this._onDataFetch.asObservable();

  // Изменения в списке колонок
  protected _onColumnsChanged: Subject<void> = new Subject();
  public readonly onColumnsChanged: Observable<void> = this._onColumnsChanged.asObservable();

  // При изменениях в запросе данных (сортировка/фильтр/группировка)
  protected _onQueryChanged: Subject<DataQuery> = new Subject();
  public readonly onQueryChanged: Observable<DataQuery> = this._onQueryChanged.asObservable();

  // При изменениях групп (свернута/развернута)
  protected _onSummariesChanged: Subject<Column> = new Subject();
  public readonly onSummariesChanged: Observable<Column> = this._onSummariesChanged.asObservable();

  // При изменении значения ячейки
  protected _onValueChanged: Subject<ValueChangedEvent> = new Subject();
  public readonly onValueChanged: Observable<ValueChangedEvent> = this._onValueChanged.asObservable();

  // При изменении чекбокс
  protected _onCheckedChanged: Subject<CheckedChangedEvent> = new Subject();
  public readonly onCheckedChanged: Observable<CheckedChangedEvent> = this._onCheckedChanged.asObservable();

  // Перетаскивание колонки
  // Тащим
  protected _onDrag: Subject<UIAction> = new Subject();
  public readonly onDrag: Observable<UIAction> = this._onDrag.asObservable();

  // Бросаем
  protected _onDrop: Subject<UIAction> = new Subject();
  public readonly onDrop: Observable<UIAction> = this._onDrop.asObservable();

  // Изменение ширины колонки
  // Тащим
  protected _onColumnResizing: Subject<UIAction> = new Subject();
  public readonly onColumnResizing: Observable<UIAction> = this._onColumnResizing.asObservable();

  // Бросаем
  protected _onColumnResize: Subject<UIAction> = new Subject();
  public readonly onColumnResize: Observable<UIAction> = this._onColumnResize.asObservable();

  // При фильтрации
  protected _onFilterShow: Subject<FilterShowEvent> = new Subject();
  public readonly onFilterShow: Observable<FilterShowEvent> = this._onFilterShow.asObservable();

  // Выделение ячейки/строки/области
  protected _onSelect: Subject<CellPosition> = new Subject();
  public readonly onSelect: Observable<CellPosition> = this._onSelect.asObservable();

  // Включение редактора
  protected _onStartEditing: Subject<CellPosition> = new Subject();
  public readonly onStartEditing: Observable<CellPosition> = this._onStartEditing.asObservable();

  // Выключение редактора
  protected _onStopEditing: Subject<boolean> = new Subject();
  public readonly onStopEditing: Observable<boolean> = this._onStopEditing.asObservable();

  // Строка перестала быть видимой после редактирования
  protected _onRowUnfiltered: Subject<any> = new Subject();
  public readonly onRowUnfiltered: Observable<any> = this._onRowUnfiltered.asObservable();

  // Контекстное меню колонки
  protected _onHeaderContextMenu: Subject<any> = new Subject();
  public readonly onHeaderContextMenu: Observable<any> = this._onHeaderContextMenu.asObservable();

  // Событие кастомной ячейки
  protected _onCustomCellEvent: Subject<any> = new Subject();
  public readonly onCustomCellEvent: Observable<any> = this._onCustomCellEvent.asObservable();

  public selection: GridSelection = new GridSelection();

  focusChangedSubscription: any;
  selectionChangedSubscription: any;
  localeChangedSubscription: any;

  protected dataQueryEvent(query: DataQuery) {
    this._onDataQuery.next(query);
  }

  protected dataFetchEvent(query: DataQuery) {
    if (query.subject) {
      query.subject.next();
      query.subject.complete();
    }
    this._onDataFetch.next();
  }

  protected columnsChangedEvent() {
    this._onColumnsChanged.next();
  }

  protected queryChangedEvent(query: DataQuery) {
    this._onQueryChanged.next(query);
  }

  protected summariesChangedEvent(c: Column) {
    this._onSummariesChanged.next(c);
  }

  protected valueChangedEvent(e: ValueChangedEvent) {
    this._onValueChanged.next(e);
  }

  protected checkedChangedEvent(e: CheckedChangedEvent) {
    this._onCheckedChanged.next(e);
  }

  protected dragEvent(e: UIAction) {
    this._onDrag.next(e);
  }

  protected dropEvent(e: UIAction) {
    this._onDrop.next(e);
  }

  protected columnResizeEvent(e: UIAction) {
    this._onColumnResize.next(e);
  }

  protected filterShowEvent(e: FilterShowEvent) {
    this._onFilterShow.next(e);
  }

  protected selectEvent(cp: CellPosition) {
    this._onSelect.next(cp);
  }

  protected startEditingEvent(cp: CellPosition) {
    this._onStartEditing.next(cp);
  }

  protected stopEditingEvent(returnFocus: boolean) {
    this._onStopEditing.next(returnFocus);
  }

  protected headerContextMenuEvent(e: any, column: Column) {
    this._onHeaderContextMenu.next({ event: e, column: column });
  }

  protected customCellEvent(e: any) {
    this._onCustomCellEvent.next(e);
  }

  // Инициируем обновление данных со всеми пересчётами
  public updateDataAsync(): Observable<any> {
    const subject = new Subject<any>();
    if (this.settings.requestData) {
      // Необходимо запросить данные
      this.doQuery(++this._dataQueryCounter, subject);
      // НО! Нужно обновить колонки.
      this.columnsChangedEvent();
      return subject;
    }

    // Запрашивать не нужно, считаем всё сами
    // Асинхронное обновление
    this.recalcData().then(() => {
      this.fetchData(new DataQuery(this._dataQueryCounter));
      let rc;
      if (this.dataSource.resultRows) {
        rc = this.dataSource.resultRows.length;
      }
      subject.next(rc);
      subject.complete();
    });

    return subject;
  }

  public copySelectionToClipboard(withHeaders: boolean) {
    DOMUtils.copyToClipboard(this.getSelectedData(this.selection).toString(withHeaders, '\t')
    );
  }

  public exportToCSV(fileName: string, columnSeparator: string = ',') { 
    DOMUtils.downloadCSV(fileName, this.dataToExport().toString(true, columnSeparator, true));
  }

  ngOnDestroy() {
    this.focusChangedSubscription.unsubscribe();
    this.selectionChangedSubscription.unsubscribe();
    this.localeChangedSubscription.unsubscribe();
  }

  constructor(public internationalization: InternationalizationService) {

    super();

    this.focusChangedSubscription = (<GridSelection>this.selection).onFocusChanged.subscribe(v => {
      this.focusChanged(v);
    });

    this.selectionChangedSubscription = (<GridSelection>this.selection).onSelectionChanged.subscribe(v => {
      this.selectionChanged(v);
    });

    this.localeChangedSubscription = this.internationalization.onLocaleChanged.subscribe(locale => {
      this.dataSource.valueFormatter.setLocale(locale);
    });
  }
}
