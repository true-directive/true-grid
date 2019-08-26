/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { GridPart } from './enums';
import { Column } from './column.class';
import { ColumnBand } from './column-band.class';
import { Utils } from './common/utils.class';

/**
 * Коллекция колонок.
 */
export class ColumnCollection {

  protected _columns: Column[] = [];

  public set columns(v: Column[]) {
    this._columns = v;
  }

  public get columns() {
    return this._columns;
  }

  // Наименование поля первой видимой колонки (исключая чекбоксы)
  public get firstField() {
    const col: Column = this.columns.find(c => c.visible && !c.isCheckbox);
    if (col) {
      return col.fieldName;
    }
    return '';
  }

  // Получение колонки по наименованию поля
  public columnByFieldName(fieldName: string): Column {
    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      if (col.fieldName === fieldName) {
        return col;
      }
    }
    return null;
  }

  // Возвращает, привязана ли слева колонка с чекбоксом к указанной колонке
  // Немного нестандартная feature
  public prevCheckbox(column: Column, place: GridPart = null, list: Column[] = null, clone: boolean = true): Column {
    for (let i = 1; i < this.columns.length; i++) {
      if (this.columns[i].fieldName === column.fieldName) {
        const col = this.columns[i - 1];
        if (col.isCheckbox) {
          const cbCol = clone ? new Column(col.fieldName, col.caption, col.width, col.type, '') : col;
          if (list) {
            list.push(cbCol);
          }
          if (place) {
            cbCol.fixed = place;
          }
          return col; // Обратите внимание - возвращаем исходную колонку
        }
        return null;
      }
    }
    return null;
  }

  // Перемещение колонки
  public reorderColumn(target: Column, dropInfo: any): boolean {

    let update = false;

    target = this.columnByFieldName(target.fieldName);
    if (!target) {
      return;
    }

    let oldIndex = -1;
    let newIndex = -1;

    let fixed: GridPart = dropInfo.place;

    if (dropInfo.item) {
      fixed = dropInfo.item.fixed;
    }

    this.columns.some((c, index) => {

      if (c === target) {
        oldIndex = index;
      }

      if (c === dropInfo.item) {
        newIndex = index;
        if (dropInfo.pos !== 'left') {
          newIndex++;
        }
      }

      const col: Column = <Column>target;
      col.fixed = fixed;
      col.visible = true;

      if (oldIndex >= 0 && (newIndex >= 0 || dropInfo.item === null)) {
        if (oldIndex > 0 && this.columns[oldIndex - 1].isCheckbox) {
          // Цепляем паровозиком наш чекбокс
          const cbCol = this.columns[oldIndex - 1];
          cbCol.fixed = fixed;
          cbCol.visible = true;
          if (oldIndex < newIndex || dropInfo.item === null) {
            Utils.moveArrayItem(this.columns, oldIndex - 1, newIndex - 1);
            Utils.moveArrayItem(this.columns, oldIndex - 1, newIndex - 1);
          } else {
            Utils.moveArrayItem(this.columns, oldIndex - 1, newIndex);
            Utils.moveArrayItem(this.columns, oldIndex, newIndex + 1);
          }
        } else {
          if (oldIndex < newIndex) {
            newIndex--;
          }
          Utils.moveArrayItem(this.columns, oldIndex, newIndex);
        }

        update = true;
        return true;
      }
      return false;
    });

    return update;
  }

  // Перемещение бэнда
  public reorderBand(targetBand: ColumnBand, dropInfo: any): boolean {

    const dropBand: ColumnBand = <ColumnBand>dropInfo.item;
    let col: Column = null;

    if (dropBand) {
      if (dropInfo.pos === 'right') {
        col = dropBand.columns[dropBand.columns.length - 1];
      } else {
        col = dropBand.columns[0];
      }
    }

    for (let j = 0; j < targetBand.columns.length; j++) {
      const bandCol = targetBand.columns[j];
      this.reorderColumn(bandCol, { item: col, pos: dropInfo.pos, place: dropInfo.place });

      if (dropInfo.pos === 'right') {
        col = bandCol;
      }
    }
    return true;
  }
}
