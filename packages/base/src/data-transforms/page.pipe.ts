/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { PageInfo } from '../page-info.class';

export class PagePipe {
  transform(rows: any[], pageInfo: PageInfo): any[] {
    const res: any[] = [];

    let i = pageInfo.offset;
    while (i < (pageInfo.offset + pageInfo.limit) && i < rows.length) {
      res.push(rows[i]);
      i++;
    }
    return res;
  }
}
