/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { SortInfo, SortType  } from '../sort-info.class';
import { Column  } from '../column.class';

export class SortPipe {

  static compare(v1: any, v2: any, sType: SortType): number {

    if ((v1 === null || v1 === undefined) && (v2 === null || v2 === undefined)) {
      return 0;
    }

    if (v1 === null || v1 === undefined) {
      return sType === SortType.ASC ? -1 : 1;
    }

    if (v2 === null || v2 === undefined) {
      return sType === SortType.ASC ? 1 : -1;
    }

    if (v1 === v2) {
      return 0;
    }

    if (sType === SortType.ASC) {
      return v1 > v2 ? 1 : -1;
    }

    return v1 < v2 ? 1 : -1;
  }

  transform(rows: any[], sortings: SortInfo[], groupedColumns: Column[] = []): any[] {

    if (!rows) {
      return [];
    }

    if (sortings === null || (sortings.length === 0 && groupedColumns.length === 0)) {
      return rows;
    }

    // Копируем массив и копию сортируем
    const rr = rows.concat().sort((a1, a2) => {

      let r = 0;
      for (let i = 0; i < groupedColumns.length; i++) {
        let k = 1;
        const el = groupedColumns[i];
        const sortInfo = sortings.find(s => s.fieldName === el.fieldName);
        if (sortInfo && sortInfo.sortType === SortType.DESC) {
          k = -1;
        }

        const v1 = a1[el.fieldName];
        const v2 = a2[el.fieldName];

        if ((v2 === null && v1 !== null) || v1 > v2) {
          r = 1 * k;
          break;
        } else {
          if ((v1 === null && v2 !== null) || v1 < v2) {
            r = -1 * k;
            break;
          }
        }
      }

      if (r !== 0) {
        return r;
      }

      if (sortings.length === 0) {
        return 0;
      }

      for (let i = 0; i < sortings.length; i++) {
        let sortInfo = sortings[i];
        let res = SortPipe.compare(a1[sortInfo.fieldName], a2[sortInfo.fieldName], sortInfo.sortType);
        if (res !== 0) {
          return res;
        }
      }
      return 0;
    });

    return rr;
  }
}
