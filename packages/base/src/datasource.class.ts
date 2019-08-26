/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Column } from './column.class';

import { Filter } from './filter.class';
import { SortInfo, SortType } from './sort-info.class';
import { Summary, SummaryType } from './summary.class';

import { FilterPipe } from './data-transforms/filter.pipe';
import { SortPipe } from './data-transforms/sort.pipe';
import { SummaryPipe } from './data-transforms/summary.pipe';

import { ColumnCollection } from './column-collection.class';
import { GridSettings } from './grid-settings.class';
import { ValueFormatter } from './value-formatter.class';

import { Utils } from './common/utils.class';

import { RowDragOverseer } from './row-drag-overseer.class';

export class DataSource {

  /**
   * Исходный набор строк
   */
  private _model: any;
  public set model(rows: any[]) {
    this._model = rows;
  }

  public get model(): any[] {
    return this._model;
  }

  /**
   * Общий текстовый фильтр
   */
  public searchString = '';

  /**
   * Filters
   */
  public readonly filters: Filter[] = [];

  /**
   * Sortings
   */
  public readonly sortings: SortInfo[] = [];

  /**
   * Resulting rows list
   */
  protected _resultRows: any[] = null;

  public get resultRowCount() {
    return this._resultRows === null ? 0 : this._resultRows.length;
  }

  get resultRows() {
    return this._resultRows;
  }

  // Value Formatter
  public readonly valueFormatter: ValueFormatter = new ValueFormatter();

  public clearSorting() {
    this.sortings.splice(0, this.sortings.length);
  }

  public clearFilters() {
    this.filters.splice(0, this.filters.length);
  }

  public clear() {
    this.searchString = '';
    this.clearFilters();
    this.clearSorting();
  }

  /**
   * Наложение фильтров
   * @param  rows Список строк
   * @return      Отфильтрованный набор строк
   */
  public doFilter(rows: any[], columns: Column[]): any[] {
    return new FilterPipe().transform(rows, columns, this.filters, this.searchString, this.valueFormatter);
  }

  /**
   * Сортировка строк.
   * @param  rows Список строк, подлежащих группировке
   * @return      Отсортированный список строк
   */
  public doSort(rows: any[]): any[] {
    return new SortPipe().transform(rows, this.sortings);
  }

  // Суммирование
  public summaries(columns: Column[]) {
    columns.forEach(c =>
      c.summaries.forEach(a => a.value = new SummaryPipe().transform(this.resultRows, c, a.type))
    );
  }

  public sortedByField(fieldName: string): SortInfo {
    return this.sortings.find(s => s.fieldName === fieldName);
  }

  // Не учитываем COUNT, т.к. после редактирования количество строк не изменится
  public summariedByColumn(col: Column): boolean {
    return col.summaries.find(s => s.type !== SummaryType.COUNT) !== undefined;
  }

  /**
   * Проверка видимости строки после изменения значения одного из полей
   * @param  r         Измененная строка
   * @param  fieldName Наименование поля
   * @return           Необходим ли перезапрос данных
   */
  public checkDataUpdateNeed(r: any, fieldName: string, columnCollection: ColumnCollection): boolean {

    const fp = new FilterPipe();
    const filterMatch = fp.match(r, columnCollection.columns, this.filters, this.searchString, this.valueFormatter);
    if (!filterMatch) {
      return true;
    }

    if (this.sortedByField(fieldName)) {
      return true;
    }

    const col: Column = columnCollection.columnByFieldName(fieldName);
    if (this.summariedByColumn(col)) {
      return true;
    }

    return false; // Ничего страшного
  }

  /**
   * Окончательная обрабтка данных и сохранение в resultRows.
   * @param  rows             [description]
   * @param  columnCollection [description]
   * @param  settings         [description]
   * @return                  [description]
   */
  protected accomplishRecalc(rows: any[], columnCollection: ColumnCollection, settings: GridSettings) {
    this._resultRows = rows;
    this.summaries(columnCollection.columns);
  }

  /**
   * Пересчет данных для отображения
   * @param  columnCollection Коллекция колонок
   * @param  settings         Настройки
   */
  public recalcData(columnCollection: ColumnCollection, settings: GridSettings) {
    // Фильтруем
    let filtered: any[];
    if (settings.treeChildrenProperty !== '') {
      // Для дерева не фильтруем - применится при обработке дерева
      filtered = this.model;
    } else {
      filtered = this.doFilter(this.model, columnCollection.columns);
    }
    // Сортируем
    const sorted: any[] = this.doSort(filtered);

    // Фиксируем
    this.accomplishRecalc(sorted, columnCollection, settings);
  }

  /**
   * Получение данных для отображения, которые обработаны вне нашего компонента.
   * Например, сервером.
   * @param  rows             Отфильтрованные, отсортированные данные.
   * @param  columnCollection Коллекция колонок
   * @param  settings         Настройки
   */
  public fetchData(rows: any[], columnCollection: ColumnCollection, settings: GridSettings) {
    // Производим окончательную обработку и фиксируем данные
    this.model = rows;
    this.accomplishRecalc(rows, columnCollection, settings);
  }

  /**
   * Установка фильтра
   * @param  f Фильтр
   */
  public setFilter(f: Filter) {
    this.removeFilter(f.fieldName);
    this.filters.push(f);
  }

  /**
   * Удаляем фильтр по заданной колонке
   * @param  fieldName Наименование поля
   * @return           Если фильтр удален - возвращаем true. Если фильтра не было - false.
   */
  public removeFilter(fieldName: string): boolean {
    for (let i = 0; i < this.filters.length; i++) {
      if (this.filters[i].fieldName === fieldName) {
        this.filters.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Получить фильтр заданной колонки.
   * Используется в том числе заголовком для отображения подсвеченной иконки
   * @param  c Колонка, для которой нужно получить фильтр
   * @return   Фильтр, если есть
   */
  public getFilter(c: Column): Filter {
    return this.filters.find(f => f.fieldName === c.fieldName);
  }

  /**
  * Data sorting
  * @param  sortings List of sortings
   */
  public sort(sortings: SortInfo[]) {
    this.clearSorting();
    sortings.forEach(s => this.sortings.push(s));
  }

  /**
   * Data filtering
   * @param  filters List of filters
   */
  public filter(filters: Filter[]) {
    this.clearFilters();
    filters.forEach(f => this.filters.push(f));
  }

  /**
   * Сортировка по колонке
   * @param  col Колонка
   */
  public sortByColumn(col: Column, add: boolean = false) {

    const sortInfo = this.sortedByField(col.fieldName);
    if (sortInfo && (add || this.sortings.length === 1)) {
        // Меняем направление сортировки на противоположное
        sortInfo.invert();
    } else {
      if (!add) {
        this.clearSorting();
      }
      this.sortings.push(new SortInfo(col.fieldName, SortType.ASC))
    }
  }

  /**
   * Убрать одну строку из результирующего набора строк. Например, по причине
   * того, что она перестала удовлетворять условиям фильтра при изменении одного
   * из полей.
   * @param  r Строка, подлежащая скрытию
   * @return   Было ли удаление
   */
  public removeResultRow(r: any): boolean {
    let i = this._resultRows.indexOf(r);
    if (i > 0) {
      this._resultRows.splice(i, 1);
      return true;
    }
    return false;
  }

  public rowData(row: any): any {
    return row;
  }

  public displayedValue(col: Column, value: any, row: any) {
    return this.valueFormatter.displayedValue(col, value, row);
  }

  public value(row: any, fieldName: string): any {
    const rd = this.rowData(row);
    return rd === null ? null : rd[fieldName];
  }

  public updateValue(row: any, fieldName: string, value: any): any {
    const rd = this.rowData(row);
    if (rd !== null) {
      rd[fieldName] = value;
    }
    return rd;
  }

  public canDrop(draggedRows: any[], dropRow: any, dropPos: string, settings: GridSettings): string {
    // Проверка возможности drag and drop
    const overseer = new RowDragOverseer();
    return overseer.canDrop(this.resultRows, draggedRows, dropRow, dropPos, false);
  }

  public moveRows(draggedRows: any[], dropTarget: any, dropPos: string, settings: GridSettings): boolean {
    for (let i = 0; i < draggedRows.length; i++) {
      let ri = this.model.indexOf(dropTarget);
      if (dropPos === 'after') {
        ri++;
      }
      const ri0 = this.model.indexOf(draggedRows[i]);
      if (ri0 < ri) {
        ri--;
      }
      Utils.moveArrayItem(this.model, ri0, ri);
    }
    return false;
  }
}
