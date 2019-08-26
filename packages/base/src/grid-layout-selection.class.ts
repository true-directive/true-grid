/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
// Диапазон в разметке
export class GridLayoutRange {

  public rangeX = 0;
  public rangeY = 0;

  constructor(
    public rowIndex: number,  // Индекс в результирующем наборе
    public columnIndex: number
  ) { }
}

// Выделение в разметке
export class GridLayoutSelection {

  public displayedStartIndex = 0; // Индекс в отображаемых строках
  public focusedRowIndex = -1;
  public focusedColumnIndex = -1;
  public readonly ranges: GridLayoutRange[] = [];

  public clear() {
    this.ranges.splice(0, this.ranges.length);
  }

  public updateDisplayedStartIndex(startIndex: number) {
    this.displayedStartIndex = startIndex;
  }
}
