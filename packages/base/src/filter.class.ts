/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { ColumnType } from './enums';
import { Internationalization } from './internationalization/internationalization.class';
import { ValueFormatter } from './value-formatter.class';

// Тип фильтра по колонке
export class FilterOperator {
  static NONE = new FilterOperator('None');
  static BETWEEN = new FilterOperator('Between');
  static NOT_BETWEEN = new FilterOperator('Not between');
  static CONTAINS = new FilterOperator('Contains');
  static NOT_CONTAINS = new FilterOperator('Not contains');
  static EQUALS = new FilterOperator('Equals');
  static NOT_EQUALS = new FilterOperator('Not equals');
  static EMPTY = new FilterOperator('Empty');
  static NOT_EMPTY = new FilterOperator('Not empty');
  static SET = new FilterOperator('Set');

  constructor(public name: string) { }
}

// Фильтр по колонке
export class Filter {

  public orFilter: Filter = null;

  get txtValue(): string {
    if (!this.value) {
      return '';
    }
    return this.value + '';
  }

  public clearItems() {
    this.items.splice(0, this.items.length);
  }

  // Клонируем фильтр. Редактор фильра будет привязан к копии,
  // чтобы не задеть текущие фильтры.
  clone(active: boolean): Filter {
    const res = new Filter(
      this.fieldName,
      this.operator,
      this.value,
      this.value2,
      this.items.slice(),
      active,
      this.format,
      this.caption,
      this.type
    );
    return res;
  }

  private valueToString(value: any, intl: Internationalization, formatter: ValueFormatter): string {
    if (value === true) {
      return intl.translate('True');
    }
    if (value === false) {
      return intl.translate('False');
    }
    let v = formatter.format(this.type, this.format, value);
    if (this.type === ColumnType.STRING) {
      return `'${v}'`;
    }
    return v;
  }

  public toString(intl: Internationalization, formatter: ValueFormatter) {

    let field = `[${this.caption}]`
    let op = '';
    let values = '';

    let v1 = '';
    let v2 = '';
    let items = '';
    if (this.value !== null) {
      v1 = this.valueToString(this.value, intl, formatter);
    }

    if (this.value2 !== null) {
      v2 = this.valueToString(this.value2, intl, formatter);
    }

    if (this.items.length > 0) {
      items = this.items.map(i => {
        return this.valueToString(i, intl, formatter);
      }).join(', ');
    }

    switch (this.operator) {
      case FilterOperator.EQUALS:
        op = ' = ';
        values = v1;
        break;
      case FilterOperator.NOT_EQUALS:
        op = ' <> ';
        values = v1;
        break;
      case FilterOperator.CONTAINS:
        op = 'Contains';
        values = v1;
        break;
      case FilterOperator.NOT_CONTAINS:
        op = 'Not contains';
        values = v1;
        break;
      case FilterOperator.BETWEEN:
        op = 'Between';
        values = `${v1} ${intl.translate('And').toUpperCase()} ${v2}`;
        break;
      case FilterOperator.NOT_BETWEEN:
        op = 'Not between';
        values = `${v1} ${intl.translate('And').toUpperCase()} ${v2}`;
        break;
      case FilterOperator.EMPTY:
        op = 'Is empty';
        break;
      case FilterOperator.NOT_EMPTY:
        op = 'Is not empty';
        break;
      case FilterOperator.SET:
        op = 'In'
        values = `(${items})`;
        break;
    }
    op = intl.translate(op).toUpperCase();
    return `${field} ${op} ${values}`;
  }

  constructor(
    public fieldName: string,
    public operator?: FilterOperator,
    public value?: any,
    public value2?: any, // For between
    public readonly items: Array<any> = [], // Selected items
    public active: boolean = false, // Фильтр применен в текущий момент
    public format: string = '', // Формат вывода
    public caption: string = '', // Заголово колонки
    public type: ColumnType = ColumnType.STRING
  ) { }
}
