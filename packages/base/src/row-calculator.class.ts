/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { GridState } from './grid-state.class';
import { RenderMode } from './enums';

/**
 * Хранит высоты строк, пересчитывает позиции строк для рендреа
 * при заданной позиции скролла
 */
export class RowCalculator {

  // Стандартная выста строки
  private _currentRH: number = null;

  public get currentRH(): number {
    if (this._currentRH === null) {
      return this.state.settings.rowHeight;
    }
    return this._currentRH;
  }

  // Список реальных высот строк
  private _rowHeights: any[] = null;

  // Минимальная высота
  private _minH: number = null;

  private set minH(v: number) {

    this._minH = v;

    if (this._minH !== null &&
       this.state.settings.fixedRowHeight) {
      // Реально строка больше по высоте...
      this._currentRH = this._minH;
    } else {
      this._currentRH = this.state.settings.rowHeight;
    }
  }

  private get minH(): number {
    return this._minH;
  }

  // Актуальная общая высота фантомных строк
  private GHOST_START = 0; // До отображаемых строк
  private GHOST_END = 0;   // После отображаемых строк

  // Сохраненные фантомные строки. Если позиция прокрутки не изменилась,
  // то используем их
  private _startRows: any[] = [];
  private _endRows: any[] = [];

  // Сохраненные высоты фантомных строк
  private _startH = -1;
  private _endH = -1;

  // Для экстремально длинных списков
  private _extraRows: any[] = [];
  private _extraH = -1;

  private ghostMaxH = 1000000;

  /**
   * Список фантомных строк до и после отображаемых строк
   * @param  pos Позиция фантомных строк (start - в начале таблицы или end - в конце)
   */
  public ghostRows(pos: 'start' | 'end' | 'extra') {

    let gs = this.GHOST_START;
    let ge = this.GHOST_END;
    let ex = 0;

    if (gs > 30 * 280000) {
      gs -= 30 * 280000;
      ex = 30 * 280000;
    }

    let total;

    if (pos === 'extra') {
      total = ex;
      if (total === this._extraH) {
        return this._extraRows; // Используем сохраненные
      }
    } else {
      if (pos === 'start') {
        total = gs;
        if (total === this._startH) {
          return this._startRows; // Используем сохраненные
        }
      } else {
        total = ge;
        if (total === this._endH) {
          return this._endRows;  // Используем сохраненные
        }
      }
    }

    const rows = [];
    const rowH = this.ghostMaxH; // Больше чем это IE не прожует
    let i = total;
    let j = 0;
    while (i > 0) {
      j++;
      if (i > rowH) {
        rows.push({H: rowH, I: j});
        i -= rowH;
      } else {
        rows.push({H: i, I: j});
        i = 0;
      }
    }

    if (pos === 'extra') {
      this._extraH = total;
      this._extraRows = rows;
      return this._extraRows;
    } else {
      if (pos === 'start') {
        this._startH = total;
        this._startRows = rows;
        return this._startRows;
      } else {
        this._endH = total;
        this._endRows = rows;
        return this._endRows;
      }
    }
  }

  /**
   * Очистка. При любом изменении данных нужно очищать
   */
  public clear() {
    this._rowHeights = null;
  }

  /**
   * Сохранение реальной высоты строки
   * @param  rowCount Общее количество строк
   * @param  index    Индекс строки, высота которой сохраняется
   * @param  h        Реальная высота строки
   */
  public setRowHeight(rowCount: number, index: number, h: number) {
    //
    if (this._rowHeights === null) {
      this._rowHeights = new Array(rowCount);
    }

    while (this._rowHeights.length <= index) {
      this._rowHeights.push(null);
    }

    // Сохраняем минимальную высоту
    if (this.minH === null || this.minH > h) {
      this.minH = h;
    }

    this._rowHeights[index] = h;
  }

  /**
   * Возврат реальной высоты строки
   * @param  index Индекс строки в списке отображаемых строк
   * @return       Реальная высота строки
   */
  public getRowHeight(index: number): number {

    if (this.state.settings.fixedRowHeight) {
      return this.currentRH;
    }

    if (this._rowHeights === null || this._rowHeights.length <= index) {
      return this.currentRH;
    }

    const res = this._rowHeights[index];
    if (res === undefined) {
      return this.currentRH;
    }

    return res;
  }

  /**
   * Возвращает позицию Y строки по заданному индексу
   * @param  ri Заданный индекс
   */
  public getRowTop(ri: number) {

    if (this.state.settings.fixedRowHeight) {
      // Просто умножение
      return ri * this.currentRH;
    }
    // Сложение всех предыдущих высот строк
    let rowTop = 0;
    for (let i = 0; i < ri; i++) {
      rowTop += this.getRowHeight(i);
    }
    return rowTop;
  }

  /**
   * Рассчитывает, сколько строк помещается на экране...
   * @param  rowIndex       Индекс первой видимой строки
   * @param  viewPortHeight Высота вьюпорта
   * @param  rows           Список отображаемых строк
   * @return                upRowCount - количество строк, между заданной и строкой, находящейся на одну страницу выше,
   * downRowCount - между заданной и строкой, находящейся на одну страницу ниже
   */
  public pageCapacity(rowIndex: number, viewPortHeight: number, rows: any[]): { upRowCount: number, downRowCount: number } {
    // Сколько строк помещается в странице
    const res = { upRowCount: 0, downRowCount: 0 };

    let dh = 0;
    let i = rowIndex;
    while (dh < viewPortHeight && i < rows.length) {
      dh += this.getRowHeight(i);
      i++; // На одну вниз
    }
    res.downRowCount = i - rowIndex - 1;

    i = rowIndex;
    dh = 0;
    while (dh < viewPortHeight && i >= 0) {
      i--; // На одну вверх
      dh += this.getRowHeight(i);
    }
    res.upRowCount = rowIndex - i - 1;
    return res;
  }

  /**
   * Вычисление информации для рендеринга
   * @param  rc             Количество строк
   * @param  pos            Позиция скролла
   * @param  viewPortHeight Высота видимой области
   * @param  overWork       Сколько дополнительных строк нужно рендерить помимо видимых
   * @return                Информация о рендеринге
   */
  protected renderInfo(rc: number, scrollPos: number, viewPortHeight: number, overWork: any): any {

    if (scrollPos < 0) {
      scrollPos = 0;
    }

    if (this.state.settings.renderMode === RenderMode.ALL) {
      // Рендерим все строки
      return {
        beforeRows: 0, beforeHeight: 0,
        renderRows: rc,
        afterRows: 0, afterHeight: 0
      };
    }

    let overWorkFwd = 4; // Рендерим на четыре строки больше перед видимой областью
    let overWorkBack = 4; // И на четыре больше после видимой области

    // Но если извне пришли настройки, то принимаем их:
    if (overWork) {
      overWorkFwd = overWork.fwd;
      overWorkBack = overWork.back;
    }

    // Предварительно формируем нулевой рузультат
    const res = {
      totalHeight: 0,
      beforeRows: 0, beforeHeight: 0,
      renderRows: 0, renderHeight: 0,
      afterRows: 0, afterHeight: 0
    };

    if (rc === 0) {
      return res;
    }

    // При фиксированной высоте строки - быстрые и простые арифметические действия
    if (this.state.settings.fixedRowHeight) {
      const HH = this.currentRH;
      let i0 = Math.floor(scrollPos / HH) - overWorkBack;
      let i1 = i0 + Math.floor(viewPortHeight / HH) + overWorkBack + overWorkFwd;

      if (i1 >= rc) {
        i0 = i0 - (i1 - rc + 1);
        i1 = rc - 1;
      }

      if (i0 < 0) {
        i0 = 0;
      }

      // Из индексов в количество...
      res.beforeRows = i0; res.beforeHeight = i0 * HH;
      res.renderRows = i1 - i0 + 1; res.renderHeight = res.renderRows * HH;
      res.afterRows = rc - i1 - 1; res.afterHeight = res.afterRows * HH;
      res.totalHeight = res.beforeHeight + res.renderHeight + res.afterHeight;

      return res;
    }

    // А теперь более сложный сценарий...
    let i = 0;
    let afterCounter = 0;
    const last10 = [];
    while (i < rc) {

      const hh = this.getRowHeight(i);

      if ((res.totalHeight + hh) < scrollPos) {
          res.beforeRows++;
          res.beforeHeight += hh;

          // Сохраним последние Х
          if (last10.length >= overWorkBack) {
            // Здесь можно сделать быстрее без shift. Но размер массива невелик..
            last10.shift();
          }
          last10.push(hh);
      } else
        if (res.totalHeight < (scrollPos + viewPortHeight)) {

          if (res.renderHeight === 0) {
            // Только что переключились в эту область
            // Перекидывем последние Х записей в рендер
            const c10 = last10.length;
            const h10 = last10.reduce((sum, h) => sum + h, 0);
            res.beforeRows -= c10; res.beforeHeight -= h10;
            res.renderRows += c10; res.renderHeight += h10;
          }
          res.renderRows++;
          res.renderHeight += hh;

        } else {
          // Первые dy записей добавляем к рендеру всё же
          if (afterCounter < overWorkFwd) {
            res.renderRows++;
            res.renderHeight += hh;
            afterCounter++;
          } else {
            res.afterRows++;
            res.afterHeight += hh;
          }
        }
      res.totalHeight += hh;
      i++;
    }
    return res;
  }

  /**
   * Обновление информации для рендеринга
   * @param  rc             Количество строк
   * @param  pos            Позиция скролла
   * @param  viewPortHeight Высота видимой области
   * @param  overWork       Сколько дополнительных строк нужно рендерить помимо видимых
   * @return                True, если есть изменения и необходимо перерендерить страницу
   */
  public updateRenderInfo(rc: number, pos: number, viewPortHeight: number, overWork: any): boolean  {

    const ri = this.renderInfo(rc, pos, viewPortHeight, overWork);
    this.state.setPage(ri.beforeRows, ri.renderRows); // Отображаемая страница
    let pageChanged = false;

    if (ri.beforeHeight !== this.GHOST_START || ri.afterHeight !== this.GHOST_END) {
      this.GHOST_START = ri.beforeHeight;
      this.GHOST_END = ri.afterHeight;
      pageChanged = true;
    }

    return pageChanged;
  }

  public trackGhostRowExtra(index: number, data: any) {
    return data.H + '/' + data.I;
  }

  public trackGhostRowStart(index: number, data: any) {
    return data.H + '/' + data.I;
  }

  public trackGhostRowEnd(index: number, data: any) {
    return data.H + '/' + data.I;
  }

  constructor(private state: GridState) { }
}
