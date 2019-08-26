/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { ColumnType, SelectionMode,
         GridPart, EditorShowMode } from './enums';

import { ValueChangedEvent, FilterShowEvent } from './events';
import { UIAction, UIActionType } from './ui-action.class';

import { DataSource } from './datasource.class';

import { Summary, SummaryType } from './summary.class';
import { SortInfo, SortType } from './sort-info.class';
import { PageInfo } from './page-info.class';

import { Column } from './column.class';
import { ColumnBand } from './column-band.class';
import { ColumnCollection } from './column-collection.class';
import { Filter } from './filter.class';
import { DataQuery } from './data-query.class';

import { CellPosition } from './cell-position.class';
import { CellRange } from './cell-range.class';
import { Selection } from './selection.class';

import { GridSettings } from './grid-settings.class';
import { GridAppearance } from './grid-appearance.class';
import { GridLayout } from './grid-layout.class';
import { GridLayoutRange, GridLayoutSelection } from './grid-layout-selection.class';

import { Utils } from './common/utils.class';
import { Keys } from './common/keys.class';

import { Internationalization } from './internationalization/internationalization.class';

/**
 * Grid's state. Contains:
 * - grid's settings
 * - provided column's list
 * - column's lists for every part of the grid (only main area in the current version)
 * - sorting info
 * - drag-n-drop state
 * - current page info
 * Receives changes of state and provides it for all parts of the grid.
 */
export abstract class GridState {

  /**
   * Data source
   */
  protected _dataSource: DataSource = null;

  public get dataSource() {
    if (this._dataSource === null) {
      this._dataSource = new DataSource();
    }
    return this._dataSource;
  }

  /**
   * Данные грида
   */
  public set model(rows: any[]) {
    this.dataSource.model = rows;
  }

  public get model(): any[] {
    return this.dataSource.model;
  }

  /**
   * Список колонок
   */
  public readonly columnCollection = new ColumnCollection();

  public set columns(v: Column[]) {
    this.columnCollection.columns = v;
    this.setLayoutsVisibility();
    this.updateLayouts();
  }

  public get columns() {
    return this.columnCollection.columns;
  }

  /**
   * Отображать ли данные в виде дерева
   */
  public get isTree(): boolean {
    // Текущая версия не поддерживает отображение дерева
    return false;
  }

  /**
   * Уровень вложенности - ноль
   */
  public get maxLevel(): number  {
    return 0;
  }

  /**
   * Position of the cell containing an editor
   */
  private _editor: CellPosition = null;

  public get editor() {
    return this._editor;
  }

  /**
   * Значение редактора. Storing value here because cell may be not rendered.
   */
  public editorValue: any = null;

  /**
   * Cell value before editing
   */
  public editorValueChanged = false;

  /**
   * If the editor has been shown. This flag is necessary for understanding
   * if the dropdown list has been shown avoid more showing
   * (during the scrolling the editor may be initialized several times).
   */
  public editorWasShown = false;

  /**
   * Editor's height. We need to remember it because cell containing editor can
   * affect the height of the row. Without storing this value the row's height will
   * be lost.
   */
  public editorHeight: number = null;


  /**
   * The width of viewport's visible area.
   * This property is used for column's width calculation
   * with setting columnAutoWidth=true.
   */
  private _clientWidth = 0;

  public get clientWidth() {
    return this._clientWidth;
  }

  private _clientHeight = 0;

  public get clientHeight() {
    return this._clientHeight;
  }

  /**
   * Left fixed area is shown. Not supported in current version.
   */
  public showFixedLeft = false;

  /**
   * Right fixed area is shown. Not supported in current version.
   */
  public showFixedRight = false;

  /**
   * The device supporting touch events is used.
   */
  public get touchMode(): boolean {
    return this.iOS || this.android;
  }

  /**
   * Main area layout
   */
  public readonly layout: GridLayout = new GridLayout(GridPart.CENTER);

  /**
   * Dragged element's layout
   */
  public readonly layoutDrag: GridLayout = new GridLayout(GridPart.DRAG_ITEM);

  /**
   * Index of the first row is displayed according to current scroll position.
   */
  private _displayedStartIndex = 0;
  public set displayedStartIndex(index: number) {
    this._displayedStartIndex = index;
    this.layouts.forEach(l => l.selection.updateDisplayedStartIndex(index));
  }

  public get displayedStartIndex():  number {
    return this._displayedStartIndex;
  }

  /**
   * Previous position of the focused cell
   */
  private _prevFocused: CellPosition = null;

  /**
   * Data query counter
   */
  protected _dataQueryCounter = 0;

  // ---------------------------------------------------------------------------
  /**
   * Grid's settings.
   */
  private _settings: GridSettings = new GridSettings();

  public set settings(s: GridSettings) { this._settings = s; }
  public get settings(): GridSettings { return this._settings; }
  public get st(): GridSettings { return this.settings; } // Short alias
  public get sta(): GridAppearance { return this.settings.appearance; } // Short alias

  /**
   * ...
   */
  public pageInfo: PageInfo = new PageInfo(0, 1);

  /**
   * Selection info
   */
  public readonly abstract selection: Selection;

  /**
   * Internationalization
   */
  public readonly abstract internationalization: Internationalization;

  /**
   * Focused cell position
   */
  public get focusedCell(): CellPosition {
    return this.selection.focusedCell;
  }

  public set focusedCell(cp: CellPosition) {
    this.selection.focusedCell = cp === null ? null : cp.clone();
  }

  /**
   * The row containing a focused cell.
   */
  public get focusedRow(): any {
    if (this.selection.focusedCell) {
      return this.selection.focusedCell.row;
    }
    return null;
  }

  /**
   * The column containing a focused cell.
   */
  public get focusedColumn(): Column {
    if (this.selection.focusedCell !== null) {
      return this.columnCollection.columnByFieldName(this.selection.focusedCell.fieldName);
    }
    return null;
  }

  /**
   * The list of columns' fieldnames which are being dragged.
   */
  public readonly disabledFields: string[] = [];

  // -- etc --
  public IE: boolean = Utils.detectIE();
  public iOS: boolean = Utils.detectIOS();
  public android: boolean = Utils.detectAndroid();

  /**
   * Handling of the pressed key before editor Initialization.
   */
  public processKeyBeforeEdit(keyEvent: any) {
    const keyChar = Keys.keyChar(keyEvent);
    if (this._editor !== null && keyChar.length === 1) {
      // Initialization of the editor is started.
      // Apply key.
      if (!this.editorValueChanged) {
        this.editorValue = keyChar;
        this.editorValueChanged = true;
      } else {
        this.editorValue += keyChar;
      }
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
    }
  }

  /**
   * Editor Initialization.
   * @param  cp            Cell position
   * @param  returnFocus   Set this parameter true if it is necessary to return the focus into the grid.
   * @param  keyEvent      The key that runs cell into the edit mode.
   * @param  cancelCurrent Set this parameter true to reject the changes of the previous editing.
   */
  public setEditor(cp: CellPosition, returnFocus: boolean = false, keyEvent: any = null, cancelCurrent: boolean = false) {

    if (this._editor === null && cp === null) {
      return;
    }

    // There is no editor or previous editor is equal to the currrent one.
    if (this._editor === null || !this._editor.equals(cp)) {

      const v0 = this.editorValue; //  Previous value
      const ed0 = this._editor;
      this._editor = cp === null ? null : cp.clone();
      this.editorHeight = null;

      // Current value
      let v: any = null;
      if (cp !== null) {
        v = cp.row[cp.fieldName];
        const col = this.columnCollection.columnByFieldName(cp.fieldName);
        if (col.type === ColumnType.STRING) {
          v = v === null ? '' : Utils.htmlToPlaintext(v);
        }
      }
      this.editorWasShown = false;
      this.editorValueChanged = false;
      this.editorValue = v;
      this.processKeyBeforeEdit(keyEvent);

      if (ed0 !== null && this._editor === null) {
        // Save value of the current editor.
        if (this.st.editorAutoCommit && !cancelCurrent) {
          this.commitEditor(ed0.row, ed0.fieldName, v0);
        }
        this.stopEditingEvent(returnFocus);
      } else {
        // Send notification about the new editor.
        if (this._editor !== null) {
          this.startEditingEvent(this._editor);
        }
      }
    }
  }

  /**
   * Visibility settings of grid's parts.
   * Only the central part is present in current version.
   * This method is supposed to be overriden in PRO-version.
   */
  public setLayoutsVisibility() {
    // Single part. No action required.
  }

  public checkClientWidth(v: number): boolean {
    if (this._clientWidth !== v) {
      this._clientWidth = v;
      this.updateLayouts();
      return true;
    }
    return false;
  }

  public checkClientHeight(v: number): boolean {
    let res = false;
    if (this._clientHeight < v) {
      res = true;
    }
    this._clientHeight = v;
    return res;
  }

  /**
   * Recalculation of rows in accordance with the specified filters,
   * sorting and other.
   */
  protected recalcData(): Promise<void> {
    return new Promise((resolve) => {
      this.dataSource.recalcData(this.columnCollection, this.settings);
      resolve();
    });
  }

  protected getQuery(counter: number = 0, subject: any = null) {
    return new DataQuery(
        counter,
        this.dataSource.filters,
        this.dataSource.searchString,
        this.dataSource.sortings,
        [],
        subject
      );
  }

  /**
   * Request data from an observer.
   * @param  counter Query counter value
   * @param  subject Observer
   */
  protected doQuery(counter: number, subject: any = null) {
    this.dataQueryEvent(this.getQuery(counter, subject));
  }

  /**
   * Initiation of data update with all recalculations.
   * @param  async Recalculation in the asynchronous thread.
   */
  public updateData(async: boolean = true) {
    if (this.settings.requestData) {
      // Необходимо запросить данные
      this.doQuery(++this._dataQueryCounter);
      // НО! Нужно обновить колонки.
      this.columnsChangedEvent();
      return;
    }

    // Запрашивать не нужно, считаем всё сами
    if (async) {
      // Асинхронное обновление
      this.recalcData().then(() => {
        this.fetchData(new DataQuery(this._dataQueryCounter));
      });
    } else {
      // Синхронное
      this.dataSource.recalcData(this.columnCollection, this.settings);
      this.fetchData(new DataQuery(this._dataQueryCounter));
    }
  }

  // Принимаем данные извне
  public fetchData(query: DataQuery, data: any[] = null) {
    // Если счетчик не совпадает, то позднее был новый запрос. И в этих данных смысла
    // уже нет
    if (this._dataQueryCounter === query.queryId) {

      if (data !== null) {
        // Если данные пересчитаны извне..
        this.dataSource.fetchData(data, this.columnCollection, this.settings);
      }

      // Обновить нужно. Потому что уровни дерева могли поменяться
      this.updateLayouts();
      // Обновляем галки колонок
      this.updateCheckColumns();
      // Обновляем индексы строк выделенных областей
      this.updateSelectionIndices('fetch');
      // Отправляем информацию о том, что данные получены
      this.dataFetchEvent(query);
    }
  }

  // Обновляем отображаемые данные в основном компоненте
  protected queryChanged() {
    // Генерируем событие о необходимости обновления данных
    this.queryChangedEvent(this.getQuery());
  }

  // Значение выбранной ячейки
  public focusedValue(c: Column): any {
    let v = null;
    if (this.focusedRow) {
      v = this.focusedRow[c.fieldName];
    }
    return v;
  }

  // Один из дочерних компонентов говорит нам, что что-то тащится.
  // Передаем заинтересованным слушателям
  public drag(e: UIAction) {
    this.dragEvent(e);
  }

  // Один из дочерних компонентов говорит нам, что что-то брошено.
  // Передаем заинтересованным слушателям
  public drop(e: UIAction) {
    this.dropEvent(e);
  }

  // -- LAYOUTS ----------------------------------------------------------------
  // Список частей компонента (Левая зафиксированная, основная центральная, правая)
  get layouts(): Array<GridLayout> {
    return [this.layout];
  }

  // Обновление состояния дочерних компонентов
  public updateLayouts() {

    if (!this.columns) {
      throw new Error('GRID: Columns are not defined');
    }

    // Все секции. Хотя пока у нас и одна только..
    // Автоматическая ширина колонок только в основной секции
    this.layouts.forEach(l => l.update(
      this.columns,
      this.st.widthUnit,
      this.st.levelIndent,
      this.clientWidth, l === this.layout && this.st.columnAutoWidth));

    // Это для нас обновление сопутствюущих дел
    this.resizeLayouts();
    this.updateLayoutSelections();
  }

  protected resizeLayouts() {
    this.layouts.forEach(l => l.resize(this.st.widthUnit, this.st.levelIndent,
      this.clientWidth, l === this.layout && this.st.columnAutoWidth));
  }

  // -- ФИЛЬТРЫ ----------------------------------------------------------------

  // Фильтр
  public showFilter(e: any, c: Column) {
    let f =  this.dataSource.getFilter(c);
    f = f ? f.clone(true) : c.createFilter(this.focusedValue(c));
    this.filterShowEvent(new FilterShowEvent(e.target, f));
  }

  // Установка фильтра
  public setFilter(f: Filter) {
    this.dataSource.setFilter(f);
    this.queryChanged();
  }

  // Очистка фильтра по заданной колонке
  public resetFilter(f: Filter) {
    if (this.dataSource.removeFilter(f.fieldName)) {
      this.queryChanged();
    }
  }

  // -- SORTING ----------------------------------------------------------------

  /**
   * Data sorting
   * @param  sortings List of sortings
   */
  public sort(sortings: SortInfo[], update: boolean = true) {
    this.dataSource.sort(sortings);
    if (update) {
      this.queryChanged();
    }
  }

  /**
   * Data filtering
   * @param  filter List of filters
   */
  public filter(filters: Filter[], update: boolean = true) {
    this.dataSource.filter(filters);
    if (update) {
      this.queryChanged();
    }
  }

  /**
   * Sort by given column
   * @param  col Column
   * @param  add Если true, то оставляем предыдущую сортировку (с зажатым shift)
   */
  public sortByColumn(col: Column, add: boolean) {
    if (!this.st.allowSorting) {
      return;
    }
    this.dataSource.sortByColumn(col, add);
    this.queryChanged();
  }

  /**
   * Сортировать по полю
   * @param  fieldName Наименование поля
   * @param  add       Добавить сортировку к другим сортировкам
   */
  public sortByField(fieldName: string, add: boolean) {
    const col: Column = this.columnByFieldName(fieldName);
    this.sortByColumn(col, add);
  }

  // -- COLUMN RESIZING & REORDERING -------------------------------------------
  // Изменение ширины колонки
  public resizeColumn(col: Column, newWidth: number) {
    col.width = newWidth;
    this.updateLayouts();
    this.columnsChangedEvent();
  }

  // Чиним состояние после drag-n-drop
  public fixDrag(target: Column) { }

  // Перемещение бэнда
  public reorderBand(targetBand: ColumnBand, dropInfo: any) {
    if (this.columnCollection.reorderBand(targetBand, dropInfo)) {
      this.updateLayouts();
      this.columnsChangedEvent();
    }
  }

  // Перемещение колонки
  public reorderColumn(target: Column, dropInfo: any, commit: boolean = true) {
    if (this.columnCollection.reorderColumn(target, dropInfo)) {
      this.updateLayouts();
      this.columnsChangedEvent();
    }
  }

  // Настройка компонента для визуализации перетаскиваемого заголовка столбца
  setDragItem(e: UIAction) {

    this.disabledFields.splice(0, this.disabledFields.length);

    if (e.target instanceof Column) {
      const newCol = new Column((<Column>e.target).fieldName, e.target.caption, e.targetWidth, ColumnType.STRING, '');
      newCol.allowFilter = true;
      newCol.fixed = GridPart.DRAG_ITEM;
      this.disabledFields.push(newCol.fieldName);
      this.layoutDrag.update([newCol], this.st.widthUnit, this.st.levelIndent, 300, false);
    } else {
      if (e.target instanceof ColumnBand) {
        // Вознамерились перетащить бэнд
        const band = <ColumnBand>e.target;
        const newCol = new Column('', band.caption, e.targetWidth, ColumnType.STRING, '');
        newCol.fixed = GridPart.DRAG_ITEM;
        // Все колонки окрасятся в серый цвет на время перетаскивания
        band.columns.forEach(c => this.disabledFields.push(c.fieldName));
        this.layoutDrag.update([newCol], this.st.widthUnit, this.st.levelIndent, 300, false);
      } else {
        // Строка?
        // Первые 4 колонки?
        const dragColumns: any[] = [];
        for (let i = 0; i < this.columns.length; i++) {
          const col = this.columns[i];
          if (!col.visible) {
            continue;
          }
          const dCol = col.clone();
          dCol.fixed = GridPart.DRAG_ITEM;
          dragColumns.push(dCol);

          if (dragColumns.length > 3) {
            break;
          }
        }

        this.layoutDrag.update(dragColumns, this.st.widthUnit, this.st.levelIndent);

        // Колонки добавлены
        // Теперь строки...
        // 1. Сфокусированная
        if (this.isRowChecked(this.focusedRow)) {
          // Берем все выделенные строки
          e.target = [];
          this.dataSource.resultRows.forEach(r => {
            if (this.isRowChecked(r) && !r.__ax_isGroup) {
              e.target.push(r);
            }
          });
        } else {
          e.target = [this.focusedRow];
        }
      }
    }
  }

  // Очистка компонента для визуализации перетаскиваемого заголовка столбца
  public clearDragItem() {
    this.disabledFields.splice(0, this.disabledFields.length);
    this.layoutDrag.update([]);
  }

  // -- PAGING -----------------------------------------------------------------
  // Проверка необходимости установки страницы отображаемых данных
  public needSetPage(i0: number, i1: number): boolean {
    return i0 < this.pageInfo.offset || i1 > (this.pageInfo.offset + this.pageInfo.limit);
  }

  // Установка страницы отображаемых данных
  public setPage(offset: number, limit: number) {
    this.pageInfo.offset = offset;
    this.pageInfo.limit = limit;
  }

  public columnByFieldName(fieldName: string): Column {
    return this.columnCollection.columnByFieldName(fieldName);
  }

  // -- EDIT -------------------------------------------------------------------
  /**
   * Проверка возможности редактирования заданной ячейки
   * @param  cp Позиция ячейки
   * @return    Можно ли редактировать
   */
  protected canEditCell(cp: CellPosition): boolean {
    if (!cp) {
      return false;
    }

    const col: Column = this.columnByFieldName(cp.fieldName);
    return this.st.canEditColumnCell(col);
  }

  /**
   * Проверка возможности переключения чекбокса (ColumnType.CHECKBOX и
   * ColumnType.BOOLEAN с возможностью изменения)
   * @param  cp Позиция ячейки
   * @return    Можно переключить или нельзя
   */
  private canToggleCheck(cp: CellPosition): boolean {

    if (!cp) {
      return false;
    }

    // Определяем колонку
    const col: Column = this.columnCollection.columnByFieldName(cp.fieldName);
    if (col && (col.isCheckbox || col.isBoolean) && col.allowEdit) {
      return true;
    }

    // Не. Нечего переключать
    return false;
  }

  /**
   * Обработка события touchstart. Переключение чекбокса.
   * @param  cp         Позиция ячейки
   * @return            True - событие обработано, дальнейшая обработка не нужна.
   */
  public touchStart(cp: CellPosition): boolean {
    // Переключение чекбокса по параметру
    if (this.st.checkByCellClick && this.canToggleCheck(cp)) {
      this.toggleCheck(cp.row, cp.fieldName);
      // Не начинаем выделение, если даже пока не переключаем чекбокс
      return true;
    }
  }

  /**
   * Обработка события mousedown. Возможно, необходимо включить редактор
   * @param  cp          Позиция
   * @return             Если true, то событие обработано, дальнейшая обработка не требуется
   */
  public mouseDown(cp: CellPosition, touch: boolean = false): boolean {

    // Если планируется переключение чекбокса, то выходим из процедуры
    if (this.st.checkByCellClick && this.canToggleCheck(cp)) {
      // Не начинаем выделение
      return true;
    }

    // Включение редактора при EditorShowMode.ON_MOUSE_DOWN
    if (this.st.editorShowMode === EditorShowMode.ON_MOUSE_DOWN && this.editor === null) {
      this.selection.focusedCell = null;
      this.selection.startSelect(cp, false);
      return true;
    }

    return false;
  }

  /**
   * Обработка события click. Переключение чекбокса мышью
   * @param  cp         [description]
   * @return            [description]
   */
  public click(cp: CellPosition): boolean {
    if (this.st.checkByCellClick && this.canToggleCheck(cp)) {
      this.toggleCheck(cp.row, cp.fieldName);
      return true;
    }
    return false;
  }

  /**
   * Отработка события DblClick. Включение редкатора по EditorShowMode.ON_DBL_CLICK
   * @param  e Параметры события
   * @param  r Строка, по которой был даблклик
   */
  public dblClick(e: any, r: any) {
    if (this.selection.isSingleCellSelected()) {
      if (this.st.editorShowMode === EditorShowMode.ON_DBL_CLICK) {
        this.startEditing(this.focusedCell);
      }
    }
  }

  // Начало редактирования
  public startEditing(cp: CellPosition, keyEvent: any = null): boolean {
    if (this.canEditCell(cp)) {
      this.setEditor(cp.clone(), false, keyEvent);
      return true;
    }
    return false;
  }

  // Окончание редактирования
  public stopEditing(cp: CellPosition, returnFocus: boolean = false, cancelChanges: boolean = false) {
    if (cp !== null && cp.equals(this.editor)) {
      this.setEditor(null, returnFocus, '', cancelChanges);
    }
  }

  /**
   * Проверка видимости строки после изменения значения одного из полей
   * @param  r         Измененная строка
   * @param  fieldName Наименование поля
   * @return           Необходим ли перезапрос данных
   */
  protected checkDataUpdateNeed(r: any, fieldName: string): boolean {
    if (this.dataSource.checkDataUpdateNeed(r, fieldName, this.columnCollection)) {
      this.queryChanged();
      return true;
    }
    return false;
  }

  public cellPosition(row: any, rowIndex: number, fieldName: string) {
    return this.selection.cellPosition(row, rowIndex, fieldName, this.settings.keyField);
  }

  // Подтверждение нового значения ячейки после редактирования
  public commitEditor(row: any, fieldName: string, value: any): boolean {

    // Останавливаем редактор
    this.stopEditing(this.editor, true);

    // Значение не изменилось
    if (this.dataSource.value(row, fieldName) === value) {
      return false;
    }

    // Индекс строки здесь не важен
    if (this.canEditCell(this.cellPosition(row, -1, fieldName))) {
      const rowData = this.dataSource.updateValue(row, fieldName, value);
      this.checkDataUpdateNeed(rowData, fieldName);
      this.valueChangedEvent(new ValueChangedEvent(rowData, fieldName));
      return true;
    }
    return false;
  }


  // -- SELECTION --------------------------------------------------------------
  // Изменение выделенной области
  protected selectionChanged(cp: CellPosition) {
    this.updateLayoutSelections(cp);
    this.selectEvent(cp);
  }

  // Фокус сместился
  protected focusChanged(cp: CellPosition) {
    if (this.st.editorShowMode === EditorShowMode.ON_MOUSE_DOWN) {
      this.stopEditing(this.editor, cp !== null);
      this.startEditing(cp);
    } else {
      this.stopEditing(this.editor, cp !== null);
    }
  }

  // Пользователь начинает выделять ячейки - MouseDown
  public startAction(cp: CellPosition, ctrl: boolean = false, byTouch: boolean = false): UIActionType {

    if (this.focusedCell != null &&
        this.focusedCell.equals(cp) &&
        this.st.editorShowMode === EditorShowMode.ON_CLICK_FOCUSED &&
        byTouch
     ) {
      // Только для touch делаем это при начале выделения.
      this.startEditing(cp);
      return null;
    }

    if (!cp || cp.fieldName === '') {
      // Не попали в ячейку
      return null;
    }

    // Сохраняем текущий фокус
    this._prevFocused = this.focusedCell === null ? null : this.focusedCell.clone();
    this.startSelect(cp, ctrl && this.st.multiSelect);
    return UIActionType.SELECT;
  }

  /**
   * Start selecting cells
   * @param  cp   Cell position
   * @param  add
   */
  public startSelect(cp: CellPosition, add: boolean = false) {
    this.selection.startSelect(cp, add);
  }

  // Пользователь продолжает выделять ячейки (MouseMove)
  public proceedToSelect(cp: CellPosition): boolean {
    if (this.st.editorShowMode === EditorShowMode.ON_MOUSE_DOWN) {
      // Включен редактор, не расширяем из него выделение
      if (this.editor && this.editor.equals(this.focusedCell)) {
        return false;
      }
    }
    // Продолжить выделение можно только в некоторых режимах при
    // отсутствии настройки перетаскивания строки
    if (this.st.rowDrag) {
      return false;
    }

    if (this.st.selectionMode !== SelectionMode.RANGE &&
       this.st.selectionMode !== SelectionMode.ROW_AND_RANGE) {
       return false;
     }
    // Можно..
    if (this.selection.proceedToSelect(cp)) {
      return true;
    }
    return false;
  }

  /**
   * The user has finished selecting the cells (MouseUp)
   * @param  cp      Cell RowPosition
   * @param  byTouch Selection took place in touch events
   * @param  button  Левая или правая кнопка мыши
   */
  public endSelect(cp: CellPosition, byTouch: boolean = false, button: number = 0) {

    // Check duplicates
    this.selection.endSelect(this.settings.selectionMode);

    // Commit the changes, start editing if necessary
    if (this.selection.focusedCell !== null) {
      if (this.st.editorShowMode === EditorShowMode.ON_FOCUS &&
          this.selection.isSingleCellSelected() &&
          button === 0) {
        this.startEditing(cp);
        return;
      }
      if (this.st.editorShowMode === EditorShowMode.ON_CLICK_FOCUSED &&
         this.focusedCell.equals(this._prevFocused) &&
         this.focusedCell.equals(cp) &&
         button === 0 &&
         !byTouch
       ) {
        this.startEditing(cp);
        return;
      }
    }
  }

  /**
   * Return the column index in the column list by field name
   * @param  fieldName Name of the field to be searched
   * @return           Column index
   */
  public columnIndex(fieldName: string): number {
    let i = 0;
    let res = -1;
    this.layouts.forEach(l => {
      for (let j = 0; j < l.columns.length && res < 0; j++) {
        if (l.columns[j].fieldName === fieldName) {
          res = i;
          break;
        }
        i++;
      }
    });
    return res;
  }

  public isSelected(pos: CellPosition): boolean {
    for (const range of this.selection.ranges) {

      let fromIndex = this.columnIndex(range.fromCell.fieldName);
      let toIndex = -1;

      if (range.toCell) {
        toIndex = this.columnIndex(range.toCell.fieldName);
      }

      if (toIndex >= 0 && toIndex < fromIndex) {
        const t = toIndex; toIndex = fromIndex; fromIndex = t;
      }

      if (toIndex === -1) {
        // С этим надо что-то делать
        if (this.st.selectionMode !== SelectionMode.ROW &&
            this.st.selectionMode !== SelectionMode.ROW_AND_RANGE) {
             range.toCell = range.fromCell;
             toIndex = fromIndex;
        }
      }
    }
    return false;
  }

  // Обновление выделенных областей для дочерних компонентов
  public updateLayoutSelections(scrollToCell: CellPosition = null) {

    this.layouts.forEach(l => l.selection.clear());

    if (this.st.selectionMode === SelectionMode.NONE) {
      return;
    }

    const A = 0;
    const B = A + this.layout.columns.length;
    const C = B;

    for (const range of this.selection.ranges) {

      if (range.fromCell.rowIndex < 0) {
        return null;
      }

      let fromIndex = this.columnIndex(range.fromCell.fieldName);
      let toIndex = -1;

      if (range.toCell) {
        toIndex = this.columnIndex(range.toCell.fieldName);
      }

      if (toIndex >= 0 && toIndex < fromIndex) {
        const t = toIndex; toIndex = fromIndex; fromIndex = t;
      }

      if (toIndex === -1) {
        // С этим надо что-то делать
        if (this.st.selectionMode !== SelectionMode.ROW &&
            this.st.selectionMode !== SelectionMode.ROW_AND_RANGE) {
             range.toCell = range.fromCell;
             toIndex = fromIndex;
        }
      }

      // Центр
      if (fromIndex < B  || toIndex  === -1) {
        let centerRange;
        if (toIndex < 0) {
          // вся строка
          centerRange = new GridLayoutRange(range.fromCell.rowIndex, 0);
          centerRange.rangeX = B - A - 1;
          centerRange.rangeY = 0;
        } else {
          centerRange = new GridLayoutRange(range.fromCell.rowIndex, fromIndex - A);

          if (toIndex < B) {
            centerRange.rangeX = toIndex - fromIndex;
          } else {
            centerRange.rangeX = B - fromIndex - 1;
          }
          centerRange.rangeY = range.toCell.rowIndex - range.fromCell.rowIndex;
        }
        this.layout.selection.ranges.push(centerRange);
      }
    }

    // Focused cell
    if (this.selection.focusedCell) {
      const ii = this.columnIndex(this.selection.focusedCell.fieldName);
      if (ii >= A && ii < B) {
        this.layout.selection.focusedRowIndex = this.selection.focusedCell.rowIndex;
        this.layout.selection.focusedColumnIndex = ii - A;
      } else {
        this.layout.selection.focusedRowIndex = -1;
      }
    } else {
      this.layout.selection.focusedRowIndex = -1;
      this.layout.selection.focusedColumnIndex = -1;
    }
    return scrollToCell;
  }

  // Делаем так, чтобы ничего не было выделено
  public clearSelection() {
    this.selection.clearAll();
  }

  // Обновление индексов строк в списке выделенных областей
  public updateSelectionIndices(s: string = '') {
    let changed = false;
    changed = this.selection.updateSelectionIndices(this.dataSource.model, this.dataSource.resultRows, this.settings.keyField);
    this.updateLayoutSelections();
    if (changed) {
      this.selectEvent(null);
    }
  }

  // Выделить заданную строку
  public selectRow(r: any, ri: number): CellPosition {
    return this.selection.selectRow(this.layouts, r, ri, '', this.settings.keyField);
  }

  // Выделение заданной строки
  public locateRow(r: any): boolean {
    const ri: number = this.dataSource.resultRows.indexOf(r);
    if (ri >= 0 ) {
      this.selectRow(r, ri);
      return true;
    }
    return false;
  }

  // Выделение строки по значению поля-идентифиатора
  public locateByKey(keyValue: any, keyField: string = ''): boolean {
    if (keyField === '') {
      keyField = this.settings.keyField;
    }

    if (this.dataSource.resultRowCount === 0) {
      return false;
    }

    const found = this.dataSource.resultRows.find(r => r[keyField] === keyValue);
    if (found) {
      const ri: number = this.dataSource.resultRows.indexOf(found);
      if (ri >= 0 ) {
        this.selectRow(found, ri);
        return true;
      }
    }
    return false;
  }

  /**
   * Поиск первой колонки, в которой есть чекбокс.
   * @param  forEdit Поиск только редактируемых полей (dataType = ColumnType.BOOLEAN)
   * @return         Найденная колонка или null, если ничего не найдено
   */
  public firstCheckableField(forEdit: boolean = true): string {

    if (forEdit && this.focusedCell) {
      const col: Column = this.columnCollection.columnByFieldName(this.focusedCell.fieldName);
      if (col && col.type === ColumnType.BOOLEAN) {
        return col.fieldName;
      }
    }

    for (let i = 0; i < this.layouts.length; i++) {
      const l = this.layouts[i];
      const c = l.columns.find(col => col.isCheckbox);
      if (c) {
        return c.fieldName;
      }
    }
    return null;
  }

  public firstCheckboxField(): string {
    return this.firstCheckableField(false);
  }

  public isRowChecked(r: any): boolean {
    const f = this.firstCheckboxField();
    return f && r[f];
  }

  // Обработка нажатия клавиши
  public processKey(
    pageCapacity: { upRowCount: number, downRowCount: number },  // Емкость предыдущей и следующей страниц
    keyEvent: any
  ): boolean {
    // При нажатии ENTER или символьной клавиши - включаем редактор
    if ((keyEvent.keyCode === Keys.ENTER || Keys.keyChar(keyEvent).length === 1)
        && this.canEditCell(this.focusedCell)
        && this.settings.editorByKey) {
      if (this.startEditing(this.focusedCell, keyEvent)) {
        // Обработали
        return true;
      }
    }

    // Дальше, всё, что мы еще можем обработать - это работа с выделенными областями
    const res = this.selection.move(this.layouts, this.settings, this.dataSource.resultRows, pageCapacity, keyEvent);

    if (res !== null) {
      return true;
    }

    // Всё-таки, клавиша не пригодилась
    return false;
  }

  // -- CHECKBOXES -------------------------------------------------------------
  // Пользователь переключает галку в группе или строке
  public toggleCheck(row: any, fieldName: string) {
    const col: Column = this.columnCollection.columnByFieldName(fieldName);
    if (col && col.type !== ColumnType.CHECKBOX) {
      this.commitEditor(row, fieldName, !row[fieldName]);
      return;
    }
    row[fieldName] = !row[fieldName];
    this.updateCheckColumns(fieldName);
    // Сигнализируем о том, что нужно проверить изменения
    this.valueChangedEvent(new ValueChangedEvent(row, fieldName));
  }

  // Пользователь переключает галку в заголовке столбца
  public toggleCheckColumn(col: Column) {
    let newValue = true;
    if (col.isChecked || col.isChecked === null) {
      newValue = false;
    }

    col.setChecked(newValue);
    this.dataSource.resultRows.forEach(r => r[col.fieldName] = newValue);
    this.queryChanged();
  }

  // Обновление зависимых галок (чекбоксов) в гриде
  public updateCheckColumns(fieldName: string = null) {
    this.columns.forEach(col => {
      if (col.type === ColumnType.CHECKBOX && (fieldName === null || col.fieldName === fieldName)) {
        let allChecked = true;
        let allNotChecked = true;
        this.dataSource.resultRows.forEach(r => {
          if (r[col.fieldName]) {
            allNotChecked = false;
          } else {
            allChecked = false;
          }
        });
        if (this.dataSource.resultRowCount === 0) {
          // Если ни одной записи нет, то состояние "Выключено"
          allChecked = false;
        }
        col.setChecked((allChecked && allNotChecked || !allChecked && !allNotChecked) ? null : allChecked);
      }
    });
  }

  // -- SUMMARIES --------------------------------------------------------------
  public updateSummaries() {
    this.dataSource.summaries(this.columns);
  }
  // Добавляет суммирование
  public addSummary(column: Column, t: SummaryType) {
    column.addSummary(t);
    this.summariesChangedEvent(column);
  }

  // Заменяет суммирование
  public setSummary(column: Column, t: SummaryType, a: Summary = null) {
    column.setSummary(t, a);
    this.summariesChangedEvent(column);
  }

  // -- ROW DRAG ---------------------------------------------------------------
  public canDrop(draggedRows: any[], dropRow: any, dropPos: string): string {
    return this.dataSource.canDrop(draggedRows, dropRow, dropPos, this.settings);
  }

  public moveRows(draggedRows: any[], dropTarget: any, dropPos: string) {
    this.dataSource.moveRows(draggedRows, dropTarget, dropPos, this.settings);
    this.updateData();
  }

  // -- EVENTS -----------------------------------------------------------------
  protected abstract dataQueryEvent(query: DataQuery): void;

  protected abstract dataFetchEvent(q: DataQuery): void;

  protected abstract columnsChangedEvent(): void;

  protected abstract queryChangedEvent(q: DataQuery): void;

  protected abstract summariesChangedEvent(c: Column): void;

  protected abstract valueChangedEvent(e: ValueChangedEvent): void;

  protected abstract dragEvent(e: UIAction): void;

  protected abstract dropEvent(e: UIAction): void;

  protected abstract columnResizeEvent(e: UIAction): void;

  protected abstract filterShowEvent(e: FilterShowEvent): void;

  protected abstract selectEvent(cp: CellPosition): void;

  protected abstract startEditingEvent(cp: CellPosition): void;

  protected abstract stopEditingEvent(returnFocus: boolean): void;
}
