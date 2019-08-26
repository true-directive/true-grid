/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Column } from './column.class';

// Группа колонок
export class ColumnBand {
  constructor(
    public caption: string,
    public columns: Column[],
    public width: number) { }

  public removeColumn(c: Column) {
    const i = this.columns.indexOf(c);
    if (i >= 0) {
      this.columns.splice(i, 1);
    }
  }
}
