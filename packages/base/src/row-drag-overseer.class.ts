/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/**
 * Некоторый набор правил, который разрешает или запрещает
 * бросать строки в указанную позицию при drag and drop.
 */
export class RowDragOverseer {

  /**
   * Возвращает позицию, в которую можно бросить относительно таргета
   * @param  resultRows  [description]
   * @param  draggedRows [description]
   * @param  dropRow     [description]
   * @param  dropPos     [description]
   * @param  isTree      [description]
   * @return             Если пустая строка - никуда бросить нельзя
   */
  public canDrop(resultRows: any[], draggedRows: any[], dropRow: any, dropPos: string, isTree: boolean = false): string {

    if (draggedRows.filter(r => r === dropRow).length > 0) {
      // Навели на одну из перетаскиваемых строк
      return '';
    }

    let previousRow: any = null;
    let nextRow: any = null;
    const ri = resultRows.indexOf(dropRow);

    if (ri > 0) {
      previousRow = resultRows[ri - 1];
      if (draggedRows.filter(r => r === previousRow).length > 0 && dropPos === 'before') {
        // Предыдущая строка - одна из перетаскиваемых строк
        return '';
      }
    }

    if (ri < resultRows.length - 1) {
      nextRow = resultRows[ri + 1];
      if (draggedRows.filter(r => r === nextRow).length > 0 && dropPos !== 'before') {
        // Следующая строка - одна из перетаскиваемых строк
        return '';
      }
    }
    return dropPos;
  }
}
