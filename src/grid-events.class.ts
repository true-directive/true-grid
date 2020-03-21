import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import { IEvents } from '@true-directive/base';
import { DataQuery } from '@true-directive/base';
import { Column } from '@true-directive/base';
import { CheckedChangedEvent, ValueChangedEvent, FilterShowEvent } from '@true-directive/base';
import { UIAction, UIActionType } from '@true-directive/base';
import { CellPosition } from '@true-directive/base';

export class GridEvents implements IEvents {
  public readonly name = 'events';
  // -- EVENTS -----------------------------------------------------------------
  // Запрос данных у родителя
  protected _onDataQuery: Subject<DataQuery> = new Subject();
  public readonly onDataQuery: Observable<DataQuery> = this._onDataQuery.asObservable();

  // Получение данных от родителя
  protected _onDataFetch: Subject<DataQuery> = new Subject();
  public readonly onDataFetch: Observable<DataQuery> = this._onDataFetch.asObservable();

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

  public dataQueryEvent(query: DataQuery) {
    this._onDataQuery.next(query);
  }

  public dataFetchEvent(query: DataQuery) {
    if (query.subject) {
      query.subject.next();
      query.subject.complete();
    }
    this._onDataFetch.next(query);
  }

  public columnsChangedEvent() {
    this._onColumnsChanged.next();
  }

  public queryChangedEvent(query: DataQuery) {
    this._onQueryChanged.next(query);
  }

  public summariesChangedEvent(c: Column) {
    this._onSummariesChanged.next(c);
  }

  public valueChangedEvent(e: ValueChangedEvent) {
    this._onValueChanged.next(e);
  }

  public checkedChangedEvent(e: CheckedChangedEvent) {
    this._onCheckedChanged.next(e);
  }

  public dragEvent(e: UIAction) {
    this._onDrag.next(e);
  }

  public dropEvent(e: UIAction) {
    this._onDrop.next(e);
  }

  public columnResizeEvent(e: UIAction) {
    this._onColumnResize.next(e);
  }

  public filterShowEvent(e: FilterShowEvent) {
    this._onFilterShow.next(e);
  }

  public selectEvent(cp: CellPosition) {
    this._onSelect.next(cp);
  }

  public startEditingEvent(cp: CellPosition) {
    this._onStartEditing.next(cp);
  }

  public stopEditingEvent(returnFocus: boolean) {
    this._onStopEditing.next(returnFocus);
  }

  public headerContextMenuEvent(e: { originalEvent: any, column: Column }) {
    this._onHeaderContextMenu.next(e);
  }

  public customCellEvent(e: any) {
    this._onCustomCellEvent.next(e);
  }
}
