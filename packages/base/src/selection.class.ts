/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { GridSettings } from './grid-settings.class';
import { GridLayout } from './grid-layout.class';
import { CellPosition } from './cell-position.class';
import { CellRange } from './cell-range.class';
import { Keys } from './common/keys.class';

import { SelectionMode } from './enums';

/**
 * Выделенные данные в таблице.
 * Содержит одну ячейку, на которой установлена фокусировка и набор
 * прямоугольных областей
 */
export abstract class Selection {

  private _lastFocusedField: string = null;
  private _focusedCell: CellPosition = null;

  /**
   * Список выделенных областей
   */
  public readonly ranges: CellRange[] = [];

  /**
   * Последняя выделенная область
   * @return Последняя выделенная область, если есть (иначе null)
   */
  private get lastRange(): CellRange {
    if (this.ranges.length === 0) {
      return null;
    }
    return this.ranges[this.ranges.length - 1];
  }

  /**
   * Позиция ячейки, на которой находится фокус
   */
  public get focusedCell(): CellPosition {
    return this._focusedCell;
  }

  public set focusedCell(cp: CellPosition) {
    let changed = false;

    if (cp === null || !cp.equals(this._focusedCell)) {
      changed = true;
    }

    this._focusedCell = cp;
    if (changed) {
      this.focusChangedEvent(this._focusedCell);
    }
  }

  /**
   * Добавление области в список выделенных областей
   * @param  range Область
   */
  private addRange(range: CellRange) {
    this.ranges.push(range);
  }

  /**
   * Очистка выделенного.
   */
  private clear(): boolean {
    const oldFocused = this.focusedCell;
    const oldRangesLength = this.ranges.length;
    this.focusedCell = null;
    this.ranges.splice(0, this.ranges.length);
    if (oldFocused !== null || oldRangesLength !== 0) {
      return true;
    }
    return false;
  }

  /**
   * Очистка выделенного и излучение события об изменении выделенного
   */
  public clearAll() {
    if (this.clear()) {
      this.selectionChangedEvent(null);
    }
  }

  /**
   * Начало выделения области пользователем
   * @param  pos  Позиция ячейки, с которой начато выделение
   * @param  ctrl Нажат ли Ctrl. Если true, то новая область будет добавлена к
   *              имеющемся. Иначе сначала производится очистка областей.
   */
  public startSelect(pos: CellPosition, ctrl: boolean) {
    // Если нажат контрол, то не сбрасываем области, а добавляем..
    if (!ctrl) {
      this.ranges.splice(0, this.ranges.length);
    }

    this.focusedCell = pos;
    this.addRange(new CellRange(pos));
    this.selectionChangedEvent(pos);
  }

  public proceedToSelect(pos: CellPosition, scrollToPos: boolean = false): boolean {

    if (this.lastRange === null) {
      return; // Some kind of error..
    }
    // Extend the range
    // Of course, the last
    const res = this.lastRange.extend(pos);
    // Scroll to this position is not necessary
    if (res) {
      this.selectionChangedEvent(scrollToPos ? pos : null);
    }
    return res;
  }

  /**
   * User finished selection
   * @param  sm Current grid's selectionMode
   * @return    If selection has been changed
   */
  public endSelect(sm: SelectionMode): boolean {
    let changed = false;
    let res = true;
    while (res) {
      res = false;
      for (let i = this.ranges.length - 1; i > 0; i--) {
        let del = false;
        const range = this.ranges[i];
        // Check if there is any such range before.
        for (let j = i - 1; j >= 0; j--) {
          const prev_range = this.ranges[j];
          if (range.equals(prev_range, sm)) {
            changed = true;
            del = true;
            this.ranges.splice(j, 1);
            break;
          }
        }

        if (del) {
          res = true;
          break;
        }
      }
    }

    // Event
    if (changed) {
      this.selectionChangedEvent(null);
    }
    return changed;
  }

  /**
   * Last position of the last range.
   * @return CellPosition
   */
  public getLastPos(): CellPosition {
    if (!this.lastRange) {
      return null;
    }
    if (this.lastRange.toCell) {
      return this.lastRange.toCell;
    } else {
      return this.lastRange.fromCell;
    }
  }

  public cellPosition(row: any, rowIndex: number, fieldName: string, keyField: string): CellPosition {
    let keyValue = null;
    if (keyField !== '') {
      keyValue = row[keyField];
    }
    return new CellPosition(row, rowIndex, fieldName, keyValue);
  }

  public findRow(rows: any[], row: any, keyField: string = ''): number {
    if (!rows) {
      return -1;
    }
    let fi = rows.indexOf(row);
    if (fi < 0 && keyField !== '') {
      const foundByKey = rows.find(r => r[keyField] === row[keyField]);
      if (foundByKey) {
        fi = rows.indexOf(foundByKey);
      }
    }
    return fi;
  }

  /**
   * Updating indices of the selected rows.
   * @param  rows       Source rows list
   * @param  resultRows Resulting rows list
   * @param  keyField   Key field name
   * @return            Returns true if indices was changed
   */
  public updateSelectionIndices(rows: any[], resultRows: any[], keyField: string = ''): boolean {

    if (!resultRows) {
      return true;
    }

    // Ничего не изменилось?
    let changed = false;

    if (this.focusedCell) {
      let r = this.focusedCell.row;
      const fName = this.focusedCell.fieldName;
      const fi = this.findRow(resultRows, r, keyField);
      if (fi < 0) {
        this._lastFocusedField = fName;
        this.focusedCell.rowIndex = -1;
        if (this.findRow(rows, r, keyField) < 0) {
          // Строки нет в исходном наборе
          this.focusedCell = null;
          changed = true;
        }
      } else {
        this.focusedCell = this.cellPosition(resultRows[fi], fi, fName, keyField);
      }
    }

    let res = true;
    while (res) {
      res = false;
      let i0 = 0;
      for (let i = i0; i < this.ranges.length; i++) {
        const range = this.ranges[i];
        const ii = range.fromCell.rowIndex;
        const ri = this.findRow(resultRows, range.fromCell.row, keyField);
        // Удаляем, если строка не найдена
        if (ri < 0) {
          const found = this.findRow(rows, range.fromCell.row, keyField);
          if (found < 0) {
            // Нет в исходном наборе строк. Можно удалить.
            this.ranges.splice(i, 1);
            changed = true;
            i0 = i + 1;
            res = true;
            break;
          } else {
            // Область не найдена в результирующем наборе строк.
            // Но есть в исходном.
            // Поэтому она останется невидимой
            range.fromCell.rowIndex = -1;
            changed = true;
            continue;
          }
        }
        if (range.fromCell.rowIndex !== ri) {
          range.fromCell.rowIndex = ri;
          changed = true;
        }
        // Если конец области та же самая ячейка, что и начало, то
        // всё уже сделано.
        if (range.toCell && range.toCell !== range.fromCell) {
          const hh = range.toCell.rowIndex - ii;
          range.toCell.rowIndex = ri + hh;
          if (range.toCell.rowIndex >= resultRows.length) {
            range.toCell.rowIndex = resultRows.length - 1;
            changed = true;
          }
          if (range.toCell.row !== resultRows[range.toCell.rowIndex]) {
            range.toCell.row = resultRows[range.toCell.rowIndex];
            changed = true;
          }

        }
      }
    }
    return changed;
  }

  // Выделить заданную строку
  public selectRow(layouts: GridLayout[], r: any, ri: number, fieldName: string = '', keyField: string = ''): CellPosition {
    if (!fieldName) {
      fieldName = layouts[0].columns[0].fieldName;
    }

    const newPos: CellPosition = this.cellPosition(r, ri, fieldName, keyField);

    this.clear();
    this.focusedCell = newPos;
    this.addRange(new CellRange(newPos));
    this.selectionChangedEvent(newPos);

    return newPos;
  }

  // Выделить первую строку
  public selectFirstRow(layouts: GridLayout[], rows: Array<any>): CellPosition {

    if (!rows || rows.length === 0) {
      return null;
    }

    const newPos = this.selectRow(layouts, rows[0], 0, this._lastFocusedField);
    this._lastFocusedField = null;
    this.selectionChangedEvent(newPos);
    return newPos;
  }

  // Изменение выделенного в соответствии с заданной клавишей
  public move(
    layouts: GridLayout[],   // Список частей грида, чтобы можно было переместиться между ними
    settings: GridSettings,  // Настройки
    rows: Array<any>,        // Отображаемый список строк
    pageCapacity: any,       // Количество строк, вмещаемых в страницу
    keyEvent: any
  ): CellPosition  {

    const keyCode = keyEvent.keyCode;
    const shift = keyEvent.shiftKey;
    const ctrl = keyEvent.ctrlKey;
    // Ничего не выделено - при нажатии Down - выделяем первую строчку
    if (!this.focusedCell) {
      if (keyCode === Keys.DOWN && !shift) {
        return this.selectFirstRow(layouts, rows);
      }
    }

    let pos: CellPosition;
    if (shift && settings.canSelectRange() && keyCode !== Keys.TAB) {
      pos = this.getLastPos();
    } else {
      pos = this.focusedCell;
    }

    const newPos: CellPosition = this.movePosition(layouts, pos, rows, pageCapacity, keyCode, shift, ctrl, settings.keyField);

    if (newPos) {
      if (shift && settings.canSelectRange() && keyCode !== Keys.TAB) {
        this.proceedToSelect(newPos, true);
      } else {
        // Если вызовем очистку, то событие изменения фокуса сработает два раза
        this.ranges.splice(0, this.ranges.length);
        this.focusedCell = newPos;
        this.ranges.push(new CellRange(newPos));
        this.selectionChangedEvent(newPos);
      }
      return newPos;
    }

    return null;
  }

  // Возващает новую позицию относительно given position
  private movePosition(
    layouts: GridLayout[],
    cellPos: CellPosition,
    rows: Array<any>,
    pageCapacity: any,
    keyCode: number,
    shift: boolean,
    ctrl: boolean,
    keyField: string
  ): CellPosition {

    if (!cellPos) {
      return null;
    }

    let ri = cellPos.rowIndex;
    const f = cellPos.fieldName;

    let res = false;
    if (keyCode === Keys.UP && ri > 0) {
      ri--;
      res = true;
    }

    if (keyCode === Keys.DOWN && ri < (rows.length - 1)) {
      ri++;
      res = true;
    }

    if (keyCode === Keys.PAGE_DOWN) {
      ri += pageCapacity.downRowCount;
      if (ri >= rows.length) {
        ri = rows.length - 1;
      }
      res = true;
    }

    if (keyCode === Keys.PAGE_UP) {
      ri -= pageCapacity.upRowCount;
      if (ri < 0) {
        ri = 0;
      }
      res = true;
    }

    let newF: string = f;
    if (keyCode === Keys.RIGHT) {
      newF = this.nextLayoutField(layouts, f);
      res = f !== newF;
    }

    if (keyCode === Keys.TAB && !shift) {
      newF = this.nextLayoutField(layouts, f);
      if (newF !== f) {
        res = true;
      } else {
        if (ri < (rows.length - 1)) {
          newF = this.firstField(layouts, f);
          ri++;
          res = true;
        }
      }
    }

    if (keyCode === Keys.TAB && shift) {
      newF = this.prevLayoutField(layouts, f);
      if (newF !== f) {
        res = true;
      } else {
        if (ri > 0) {
          newF = this.lastField(layouts, f);
          ri--;
          res = true;
        }
      }
    }

    if (keyCode === Keys.LEFT) {
      newF = this.prevLayoutField(layouts, f);
      res = f !== newF;
    }

    if (keyCode === Keys.HOME) {
      if (ctrl) {
        // В начало таблицы
        if (ri > 0) {
          ri = 0;
          res = true;
        }
      } else {
        // В начало строки
        newF = this.firstField(layouts, f);
        res = f !== newF;
      }
    }

    if (keyCode === Keys.END) {
      // В конец таблицы
      if (ctrl) {
        if (ri < (rows.length - 1)) {
          ri = rows.length - 1;
          res = true;
        }
      } else {
        // Последнее поле
        newF = this.lastField(layouts, f);
        res = f !== newF;
      }
    }

    if (res) {
      return this.cellPosition(rows[ri], ri, newF, keyField);
    }

    return null;
  }

  // Ищет колонку по лэйаутам
  public findField(layouts: GridLayout[], fieldName: string): {layout: number, index: number} {
    for (let i = 0; i < layouts.length; i++) {
      for (let j = 0; j < layouts[i].columns.length; j++) {
        const col = layouts[i].columns[j];
        if (col.fieldName === fieldName) {
          return { layout: i, index: j };
        }
      }
    }
    return null;
  }

  // Колонка, следующая за заданной. Сквозь все лэйауты
  // Если следующего нет, возвращает заданное поле
  private nextLayoutField(layouts: GridLayout[], fieldName: string): string {
    let res = fieldName;
    const cPos = this.findField(layouts, fieldName);

    if (!cPos) {
      return res;
    }

    // Следуюшая колонка этой области
    if (cPos.index < (layouts[cPos.layout].columns.length - 1)) {
      res = layouts[cPos.layout].columns[cPos.index + 1].fieldName;
    } else {
      // Перебираемся в следующую область
      if (cPos.layout < (layouts.length - 1) && layouts[cPos.layout + 1].columns.length > 0) {
        res = layouts[cPos.layout + 1].columns[0].fieldName;
      }
    }

    return res;
  }

  // Колонка, предшествуюшая заданной. Сквозь все лэйауты
  // Если следующего нет, возвращает заданное поле
  private prevLayoutField(layouts: GridLayout[], fieldName: string): string {
    let res = fieldName;
    const cPos = this.findField(layouts, fieldName);

    if (!cPos) {
      return res;
    }

    if (cPos.index > 0) {
      // Предыдущая колонка этой области
      res = layouts[cPos.layout].columns[cPos.index - 1].fieldName;
    } else {
      if (cPos.layout > 0 && layouts[cPos.layout - 1].columns.length > 0) {
        // Перебираемся в следующую область
        const prevL = layouts[cPos.layout - 1];
        res = prevL.columns[prevL.columns.length - 1].fieldName;
      }
    }
    return res;
  }

  // Поле самой первой колонки
  // Если каким-то чудом нет ни одной колонки - возвращаем fieldName из аргументов
  private firstField(layouts: GridLayout[], fieldName: string) {
    for (let i = 0; i < layouts.length; i++) {
      if (layouts[i].columns.length > 0) {
        return layouts[i].columns[0].fieldName;
      }
    }
    return fieldName;
  }

  // Поле самой последней колонки
  // Если каким-то чудом нет ни одной колонки - возвращаем fieldName из аргументов
  private lastField(layouts: GridLayout[], fieldName: string) {
    for (let i = layouts.length - 1; i >= 0 ; i--) {
      if (layouts[i].columns.length > 0) {
        return layouts[i].columns[layouts[i].columns.length - 1].fieldName;
      }
    }
    return fieldName;
  }

  public isSingleCellSelected(): boolean {
    if (this.focusedCell !== null && this.ranges.length === 1) {
      if (this.focusedCell.rowIndex === this.ranges[0].fromCell.rowIndex) {
        if (this.focusedCell.fieldName === this.ranges[0].fromCell.fieldName) {
          if (this.ranges[0].toCell === null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  protected abstract selectionChangedEvent(cp: CellPosition): void;

  protected abstract focusChangedEvent(cp: CellPosition): void;
}
