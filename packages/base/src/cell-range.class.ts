/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { CellPosition } from './cell-position.class';
import { SelectionMode } from './enums';

/**
 * Range of cells
 * Прямоугольная область в таблице. Определяется полями:
 *  - fromCell: CellPosition  - начальная ячейка
 *  - toCell: CellPosition - конечная ячейка
 */
export class CellRange {
  public toCell: CellPosition = null;

  public equals(range: CellRange, sm: SelectionMode): boolean {
    if (sm === SelectionMode.ROW || sm === SelectionMode.ROW_AND_RANGE) {
      if (this.fromCell.row === range.fromCell.row) {
        if (this.toCell === null && range.toCell === null) {
          return true;
        }
      }
    }

    if (this.fromCell.row !== range.fromCell.row) {
      return false;
    }

    if (this.fromCell.fieldName !== range.fromCell.fieldName) {
      return false;
    }

    if (this.toCell === null && range.toCell !== null) {
      return false;
    }

    if (this.toCell !== null && range.toCell === null) {
      return false;
    }

    if (!this.toCell.equals(range.toCell)) {
      return false;
    }

    return true;
  }

  public clone(): CellRange {
    const res = new CellRange(this.fromCell.clone());
    if (this.toCell !== null) {
      res.toCell = this.toCell.clone();
    }
    return res;
  }

  public extend(pos: CellPosition): boolean {

    if (pos.fieldName === this.fromCell.fieldName &&
        pos.rowIndex === this.fromCell.rowIndex) {
      const res = this.toCell !== null;
      this.toCell = null;
      return res;
    }

    if (!this.toCell && !pos) {
      return false;
    }

    if (!this.toCell && pos) {
      this.toCell = pos;
      return true;
    }

    if (this.toCell && !pos) {
      this.toCell = null;
      return true;
    }

    if (this.toCell.row !== pos.row ||
        this.toCell.rowIndex !== pos.rowIndex ||
        this.toCell.fieldName !== pos.fieldName) {
      this.toCell = pos;
      return true;
    }

    // Не поменялось
    return false;
  }

  constructor(public fromCell: CellPosition) { }
}
