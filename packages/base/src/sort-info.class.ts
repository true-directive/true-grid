/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
// Тип сортировки
export enum SortType {
  NONE = 'None',
  ASC = 'ASCENDING',
  DESC = 'DESCENDING'
}

// Информация о сортировке грида
export class SortInfo {

  constructor(
    public fieldName: string,
    public sortType: SortType) { }

  public set(fieldName: string, sortType: SortType) {
    this.fieldName = fieldName;
    this.sortType = sortType;
  }

  public invert() {
    this.sortType = this.sortType === SortType.ASC ? SortType.DESC : SortType.ASC;
  }

  public sort(fieldName: string) {
    if (this.sortType === SortType.ASC && this.fieldName === fieldName) {
      this.sortType = SortType.DESC;
    } else {
      this.fieldName = fieldName;
      this.sortType = SortType.ASC;
    }
  }

  public toString(): string {
    const st = this.sortType + '';
    return `${this.fieldName} ${st}`;
  }
}
