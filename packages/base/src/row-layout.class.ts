/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { RowPosition } from './row-position.class';

/**
 * Информация о разметке строки
 */
export class RowLayout {
  /**
   * Обрамляющий прямоугольник
   */
  public clientRect: DOMRect;

  /**
   * Индекс строки в результирующем списке грида
   */
  public index: number;

  /**
   * Row directive
   */
  public rowComponent: any;

  /**
   * Поиск строки по координатам
   * @param  rows Список разметок строк
   * @param  x    Координата X
   * @param  y    Координата Y
   * @return      Найденная разметка (null если не найдено)
   */
  public static rowByXY(rows: RowLayout[], x: number, y: number): RowLayout {
    for (let i = 0; i < rows.length; i++) {
      const rl = rows[i];
      const yy = rl.clientRect.top;
      const hh = rl.clientRect.height;

      if (y >= yy && y < (yy + hh)) {
        return rl;
      }
    }
    return null;
  }

  /*
  protected static isSameLevel(r1: any, r2: any) {
    const l1 = r1.rowComponent.row.level;
    const l2 = r2.rowComponent.row.level;
    if (isNaN(l1) && isNaN(l2)) {
      return true;
    }

    if (l1 === l2) {
      return true;
    }
    return false;
  }
  */


  /**
   * Поиск позиции строки для вставки
   * @param  rows Список разметок строк
   * @param  x    Координата X
   * @param  y    Координата Y
   * @return      Найденная разметка и позиция для вставки (до или после найденной строки)
   */
  public static rowPosByXY(rows: RowLayout[], x: number, y: number, tree: boolean = false): RowPosition {
    let prev = null;
    for (let i = 0; i < rows.length; i++) {
      const rl = rows[i];
      const yy = rl.clientRect.top;
      const xx = rl.clientRect.left;
      const hh = rl.clientRect.height;
      const ww = rl.clientRect.width;
      const h2 = hh / 2;
      const h13 = hh / 3;
      const h23 = (2 * hh) / 3;

      if (x < xx || x > (xx + ww)) {
        continue;
      }

      if (tree) {
        if (y >= yy && y < (yy + h13)) {
          return { rl: rl, rl_hover: rl, pos: 'before' };
        }

        if (y > (yy + h23) && y <= (yy + hh)) {
          return { rl: rl, rl_hover: rl, pos: 'after' };
        }

        if (y >= (yy + h13) && y <= (yy + h23)) {
          return { rl: rl, rl_hover: rl, pos: 'in' };
        }

        if (i === (rows.length - 1) && y >= (yy + hh)) {
          return { rl: rl, rl_hover: null, pos: 'last' };
        }
      } else {
        if (y >= yy && y <= (yy + h2)) {
          return { rl: rl, rl_hover: rl, pos: 'before' };
        }

        if (y > (yy + h2) && y <= (yy + hh)) {
          return { rl: rl, rl_hover: rl, pos: 'after' };
        }
      }

      /*
      if (y >= yy && y < (yy + h2)) {
        if (prev && RowLayout.isSameLevel(prev, rl)) {
          // ПОДМЕНА
          return { rl: prev, rl_hover: rl, pos: 'after' };
        }
        return { rl: rl, rl_hover: rl, pos: 'before' };
      }

      if (y >= (yy + h2) && y < (yy + hh)) {
        return { rl: rl, rl_hover: rl, pos: 'after' };
      }

      if (i === (rows.length - 1) && y >= (yy + hh)) {
        return { rl: rl, rl_hover: null, pos: 'last' };
      }
      */
      prev = rl;
    }
    return { rl: null, rl_hover: null, pos: '' };
  }
}
