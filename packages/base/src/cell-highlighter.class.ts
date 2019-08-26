/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { ColumnType } from './enums';
import { Column } from './column.class';

import { Strings } from './common/strings.class';

export class CellHighlighter {
  // Подсветка найденной подстроки
  public static highlight(searchStr: string, col: Column, v: string, v_displayed: string): string {

    if (!v || !v_displayed) {
      return v_displayed;
    }

    const s = searchStr.toLowerCase(); 

    if (s === '') {
      return v_displayed;
    }

    if (col.type === ColumnType.NUMBER) {
      if (!/\d/.test(s)) {
        return v_displayed;
      }
    }

    const start_hl = `<span class='true-hl'>`;
    const end_hl = `</span>`;

    if (col.type === ColumnType.UNSAFE_HTML || col.type === ColumnType.HTML) {
      let decoratedValue = Strings.decorate(v, s, start_hl, end_hl);
      // Если пробел на границе, то надо заменить на &nbsp;
      decoratedValue = decoratedValue.replace('> ', '>&nbsp;').replace(' <', '&nbsp;<');
      return v_displayed.replace(v, decoratedValue);
    }

    return Strings.decorate(v_displayed, s, start_hl, end_hl);
  }
}
