/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { SummaryType } from '../summary.class';
import { Column } from '../column.class';

export class SummaryPipe {

  transform(rows: any[], c: Column, t: SummaryType): any {

    if (t === SummaryType.COUNT) {
      return rows.length;
    }

    let res: any = null;
    let rCount = 0;

    if (t === SummaryType.SUM || t === SummaryType.AVERAGE) {
      res = 0;
    }

    rows.forEach(r => {

      if (t === SummaryType.SUM || t === SummaryType.AVERAGE) {
        if (r[c.fieldName] !== null) {
          res += r[c.fieldName];
          rCount++;
        }
      }

      if (t === SummaryType.MIN) {
        res = res === null || r[c.fieldName] < res ? r[c.fieldName] : res;
      }

      if (t === SummaryType.MAX) {
        res = res === null || r[c.fieldName] > res ? r[c.fieldName] : res;
      }
    });

    if (t === SummaryType.AVERAGE) {
      if (rCount > 0) {
        res = res / rCount;
      } else {
        res = null;
      }
    }

    return res;
  }
}
