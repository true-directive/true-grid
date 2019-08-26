/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { ColumnType } from '../enums';
import { Column } from '../column.class';
import { Filter, FilterOperator } from '../filter.class';
import { ValueFormatter } from '../value-formatter.class';

export class FilterPipe {
  private _searchStringApplicableForNumbers: boolean = false;
  private _searchStringApplicableForDates: boolean = false;

  public match(row: any, columns: Column[], filters: Filter[], searchString: string, valueFormatter: ValueFormatter = null): boolean {
    let res = true;

    if (searchString) {
      res = false;
      columns.some(c => {
        let v = row[c.fieldName];
        if (c.type === ColumnType.STRING && v && v.toLowerCase().indexOf(searchString) >= 0) {
          res = true;
          return true;
        }

        if (c.type === ColumnType.REFERENCE && v && v.toLowerCase().indexOf(searchString) >= 0) {
          res = true;
          return true;
        }

        if (c.type === ColumnType.UNSAFE_HTML || c.type === ColumnType.HTML) {
          if (c.displayField !== '') {
            if (v && v.toLowerCase().indexOf(searchString) >= 0) {
              res = true;
              return true;
            }
          }
        }

        if (c.type === ColumnType.DATETIME && this._searchStringApplicableForDates) {
          if (valueFormatter !== null) {
            const vs: string = valueFormatter.displayedValue(c, v, row) + '';
            if (vs && vs.toLowerCase().indexOf(searchString) >= 0) {
              res = true;
              return true;
            }
          }
        }

        if (c.type === ColumnType.NUMBER && this._searchStringApplicableForNumbers) {
          if (valueFormatter !== null) {
            const vs: string = valueFormatter.displayedValue(c, v, row) + '';
            if (vs && vs.toLowerCase().indexOf(searchString) >= 0) {
              res = true;
              return true;
            }
          }
        }

        return false;
      });

      if (!res) {
        return false;
      }
    }

    for (let i = 0; i < filters.length; i++) {
      // Фильтр
      const f = filters[i];
      // Значение поля
      const v = row[f.fieldName];
      let vv = v;

      let v1 = f.value;
      let v2 = f.value2;

      const s: string = v ? (v + '').toLowerCase() : '';

      if (f.type === ColumnType.DATETIME) {
        vv = vv !== null ? vv.getTime() : null;
        v1 = v1 !== null ? v1.getTime() : null;
        v2 = v2 !== null ? v2.getTime() : null;
      }

      if (f.type === ColumnType.BOOLEAN) {
        v1 = f.value;
        if (f.operator === FilterOperator.EQUALS) {
          if (vv !== v1) {
            res = false;
          }
        }
        if (f.operator === FilterOperator.NOT_EQUALS) {
          if (vv === v1) {
            res = false;
          }
        }
      }

      // Задан набор значений
      if (f.operator === FilterOperator.SET) {
        if (f.items.indexOf(vv) < 0) {
          res = false;
        }
      }

      if (f.operator === FilterOperator.CONTAINS) {
        // Содержит подстроку
        if (s.indexOf(f.txtValue.toLowerCase()) < 0) {
          res = false;
        }
      }

      if (f.operator === FilterOperator.NOT_CONTAINS) {
        // НЕ содержит подстроку
        if (s.indexOf(f.txtValue.toLowerCase()) >= 0) {
          res = false;
        }
      }

      if (f.operator === FilterOperator.EQUALS) {
        if (s !== f.txtValue.toLowerCase()) {
          res = false;
        }
      }

      if (f.operator === FilterOperator.NOT_EQUALS) {
        if (s === f.txtValue.toLowerCase()) {
          res = false;
        }
      }

      if (f.operator === FilterOperator.BETWEEN) {
        if (vv < v1 || vv > v2) {
          res = false;
        }
      }

      if (f.operator === FilterOperator.NOT_BETWEEN) {
        if (vv >= v1 && vv <= v2) {
          res = false;
        }
      }
    }
    return res;
  }

  public transform(rows: any[], columns: Column[], filters: Filter[], searchString: string, vf: ValueFormatter): any[] {

    if (!rows) {
      return rows;
    }

    searchString = searchString.toLowerCase();

    if (/\d/.test(searchString)) {
      this._searchStringApplicableForDates = true;
      this._searchStringApplicableForNumbers = true;
    }

    return !searchString && (filters === undefined || filters.length === 0) ?
      rows : rows.filter(
        row => {
          return this.match(row, columns, filters, searchString, vf);
        }
      );
  }
}
