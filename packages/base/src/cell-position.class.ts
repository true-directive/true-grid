/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/**
 * Позиция ячейки в гриде.
 * Строка и индекс строки нужны вместе, чтобы при сортировке или фильтрации
 * мы могли перезадать индекс.
 * Просто строкой довольствоваться не удобно, т.к. постоянно придется
 * использовать indexOf.
 */
export class CellPosition {

  constructor(
    public row: any, // Строка, в которой находится ячейка
    public rowIndex: number, // Индекс этой строки
    public fieldName: string, // Наименование поля
    public keyValue: any = null
  ) { }

  clone(): CellPosition {
    return new CellPosition(this.row, this.rowIndex, this.fieldName, this.keyValue);
  }

  equals(cp: CellPosition): boolean {
    if (cp === null) {
      return false;
    }
    // Ключевое значение однозначно может указать на равенство строк
    return (this.keyValue !== null && this.keyValue === cp.keyValue || this.row === cp.row) && this.fieldName === cp.fieldName;
  }

}
