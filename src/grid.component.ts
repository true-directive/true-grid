/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, ViewChild,
         ElementRef, ChangeDetectorRef,  KeyValueDiffer,
         KeyValueDiffers, EventEmitter, Inject
       } from '@angular/core';

import { Observable } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

import { Column, ColumnBand, CellPosition, GridSettings,
         GridPart, ColumnType, Selection,
         UIActionType, UIAction, Keys, RowPosition,
         RowLayout } from '@true-directive/base';

import { ScrollerComponent } from './scroller.component';
import { GridViewComponent } from './grid-view.component';
import { GridHeaderComponent } from './grid-header.component';

import { RowDirective } from './row.directive';

import { GridStateService } from './grid-state.service';
import { InternationalizationService } from './internationalization/internationalization.service';

import { RowDragEvent, RowClickEvent, ContextMenuEvent,
         CellClickEvent } from '@true-directive/base';

@Component({
  selector: 'true-grid',
  templateUrl: './grid.component.html',
  providers: [{ provide: 'gridState', useClass: GridStateService }],
  styleUrls: [
              // Эти стили определяют разметку и поведение компонента.
              './styles/grid.behavior.scss'
            ]
})
export class GridComponent extends GridViewComponent {

  @Output('rowMouseDown')
  rowMouseDown: EventEmitter<any> = new EventEmitter<any>();

  @Output('rowMouseUp')
  rowMouseUp: EventEmitter<any> = new EventEmitter<any>();

  @Output('rowClick')
  rowClick: EventEmitter<RowClickEvent> = new EventEmitter<RowClickEvent>();

  @Output('cellClick')
  cellClick: EventEmitter<CellClickEvent> = new EventEmitter<CellClickEvent>();

  @Output('rowDblClick')
  rowDblClick: EventEmitter<RowClickEvent> = new EventEmitter<RowClickEvent>();

  @Output('rowKeyDown')
  rowKeyDown: EventEmitter<any> = new EventEmitter<any>();

  @Output('contextMenu')
  contextMenu: EventEmitter<ContextMenuEvent> = new EventEmitter<ContextMenuEvent>();

  @Output('selectionChanged')
  selectionChanged: EventEmitter<Selection> = new EventEmitter<Selection>();

  /**
   * Пользователь перетащил строки. Событие возникает до того, как строки будут перенесены
   * гридом. Это действие можно отменить и обработать вне грида.
   */
  @Output()
  rowDrag: EventEmitter<RowDragEvent> = new EventEmitter<RowDragEvent>(false);

  /**
   * Пользователь перетащил строки и грид обработал это действие.
   */
  @Output()
  rowDragged: EventEmitter<RowDragEvent> = new EventEmitter<RowDragEvent>(false);

  /**
   * Маркер, указывающий новую позицию перетаскиваемого столбца
   */
  @ViewChild('dropMarker')
  dropMarker: any;

  private _cellTouched: CellPosition = null; // Ячейка с тачем
  private _cellTouchedScrollPos: { X: number, Y: number } = { X: 0, Y: 0 };

  private _dragColumn = false; // Перетаскивание заголовка колонки в процессе

  private _drag_x0 = -1; // Предыдущая позиция перетаскиваемого заголовка
  private _drag_y0 = -1;
  private _lastSel = 0; // Время последнего изменения выделения
  private _paging = false; // Грид в процессе исполнения PgDn/PgUp

  public get isDragging() {
    return this._dragColumn;
  }

  /**
   * Начало действия пользователя (перемещение строки или выделение ячеек)
   * @param  eX      Начальная координата X
   * @param  eY      Начальная координата Y
   * @param  place   Часть грида, в которой инициировано действие
   * @param  ctrlKey Нажата ли клавиша Ctrl
   * @param  byTouch Инициировано ли тач-событием
   */
  protected startAction(cp: CellPosition, eX: number, eY: number, place: GridPart, ctrlKey: boolean = false, byTouch: boolean = false) {
    if (cp && cp.row) {
      this.scroller.prepareAutoScroll();
      const uiType = this.state.startAction(cp, ctrlKey, byTouch);
      if (uiType) {
        this.uiAction = new UIAction(uiType, null, eX, eY);
        this.addDocumentMouseListeners();
      }
    }
  }

  /**
   * Касание пальцем
   * @param  e Параметры события
   */
  public touchStart(e: any) {

    // В течение 50мс не выделяем по тачстарту, потому что этот тач останавливает
    // прокрутку
    if (this._lastScroll.time > 0) {
      const ms = Date.now() - this._lastScroll.time;
      if (ms < 50) {
        // Не выделяем ничего, если мы остановили прокрутку
        return;
      }
    }

    e.stopPropagation();

    const touches = e.changedTouches;
    if (touches.length === 1) {
      // Если касание одно, то запоминаем ячейку, которой касаемся
      this._cellTouched = this.cellByXY(touches[0].clientX, touches[0].clientY);
      // Если обработано как mousedown - больше не делаем ничего
      // (возможно переключили чекбокс или включили редактирование)
      if (this.state.touchStart(this._cellTouched)) {
        return;
      }

      // Запоминаем положение прокрутки
      this._cellTouchedScrollPos = {
        X: this.scroller.scrollLeft,
        Y: this.scroller.scrollTop
      };
    }
  }

  /**
   * Окончание касания
   * @param  e Параметры события
   */
  public touchEnd(e: any) {

    const touches = e.changedTouches;
    if (touches.length >= 1) {
      let rr = this.cellByXY(touches[0].clientX, touches[0].clientY);
      if (rr !== null &&
          rr.equals(this._cellTouched) &&
          // Проверим, не было ли скролла во время касания
          this._cellTouchedScrollPos.X === this.scroller.scrollLeft &&
          this._cellTouchedScrollPos.Y === this.scroller.scrollTop
        ) {

        if (!rr.equals(this.state.focusedCell)) {
          // Если клик не на выделенной ячейке, то начинаем выделение.
          // Начало и окончание выделения вынесено сюда, т.к. мы не можем
          // сразу понять, действие пользователя - это прокрутка или
          // выделение строки.
          // Поэтому, если положение прокрутки не изменилось - выделяем
          this.startAction(rr, touches[0].clientX, touches[0].clientY, GridPart.CENTER, false, true);
        } else {
          // Редактирование и фокус на редакторе
          this.state.startAction(this._cellTouched, false, true);
          e.stopPropagation();
          return;
        }

        // Заканчиваем выделение в любом случае
        this.state.endSelect(rr, true);
      }
    }
    e.stopPropagation();
  }

  /**
   * Нажатие кнопки мыши.
   * @param  e Параметры события
   */
  public dataMouseDown(e: any) {

    if (this._cellTouched) {
      // Touchstart has been handled. Skip this mousedown.
      return;
    }

    this.rowMouseDown.emit(e);

    if (!e.defaultPrevented) {
      const cp: CellPosition = this.cellByXY(e.clientX, e.clientY);
      if (this.state.mouseDown(cp)) {
        // This event has been handled.
        return;
      }
      this.startAction(cp, e.clientX, e.clientY, GridPart.CENTER, e.ctrlKey);
    }
  }

  protected doRowClick(e: any) {
    if (this.state.click(this.cellByXY(e.clientX, e.clientY))) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  public dataContextMenu(e: any) {
    if (this.settings.dataContextMenuActions.length > 0) {
      //
      return;
    }

    this.contextMenu.emit(
      new ContextMenuEvent(this.cellByXY(e.clientX, e.clientY), e)
    );
  }

  public dataRowClick(e: any, r: any) {

    this.rowClick.emit(new RowClickEvent(r, e));
    this.cellClick.emit(new CellClickEvent(this.cellByXY(e.clientX, e.clientY), e));

    if (this._cellTouched) {
      // Skip this click.
      this._cellTouched = null;
      return;
    }

    this.doRowClick(e);
  }

  public dataRowDblClick(e: any, r: any) {
    this.rowDblClick.emit(new RowClickEvent(r, e));
    this.state.dblClick(e, r);
  }

  /**
   * Key event handler
   * @param  keyEvent Key event parameters
   */
  public processKey(keyEvent: any) {

    this.rowKeyDown.emit(keyEvent);

    if (keyEvent.defaultPrevented) {
      return;
    }

    let keyCode: number = keyEvent.keyCode;

    if (keyCode === Keys.SPACE && this.state.focusedRow) {
      let f = this.state.firstCheckableField();
      if (f !== '') {
        this.toggleCheckbox({row: this.state.focusedRow, fieldName: f});
        return true;
      }
    }

    let ri = this.state.dataSource.resultRows.indexOf(this.state.focusedRow);

    if (!this.state.st.fixedRowHeight && (keyCode === Keys.PAGE_DOWN || keyCode === Keys.PAGE_UP)) {
      // При переменной высоте строк прокрутить на одну страницу вниз или вверх - большая печаль.
      // Потому что мы не знаем, какая высота у строк выше или ниже текущей страницы.
      // Поэтому принимаем тяжелое решение и...
      // 1. Игнорируем нажатие, если еще не обработали предыдущее:
      if (this._paging) {
        return;
      }

      // 2. Рендерим с запасом
      const overWork = { fwd: 4, back: 4 };

      // 3. Запас как раз равен максимальному количеству строк, умещающемуся на экране
      if (keyCode === Keys.PAGE_DOWN) {
        overWork.fwd = this.scroller.viewPortHeight / this.RC.currentRH + 1;
      } else
        if (keyCode === Keys.PAGE_UP) {
          overWork.back = this.scroller.viewPortHeight / this.RC.currentRH + 1;
        }

      // 4. Рендерим страницу с заданной переработкой
      this.updatePage('keydown', true, overWork);

      // 5. Указываем на приостановку обработки клавиш
      this._paging = true;
      setTimeout(() => {
        // 6. Теперь мы можем точно рассчитать емкость предыдущей страницы
        const newPageCapacity = this.RC.pageCapacity(ri, this.scroller.viewPortHeight, this.state.dataSource.resultRows);
        // 7. Handle key
        this.state.processKey(newPageCapacity, keyEvent);
        // 8. Done
        this._paging = false;
      }, 50);
      return;
    }
    // Остальное намного проще
    let pageCapacity = this.RC.pageCapacity(ri, this.scroller.viewPortHeight, this.state.dataSource.resultRows);
    return this.state.processKey(pageCapacity, keyEvent);
  }

  public dataKeyDown(e: any) {
    if (this.processKey(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Continue selecting
   * @param  e Event parameters
   */
  private doSelect(e: any) {
    const rr = this.cellByXY(e.clientX, e.clientY);
    if (rr && rr.fieldName !== '') {
      this.state.proceedToSelect(rr);
    }

    this.scroller.checkAutoScrollX(e.clientX);
    this.scroller.checkAutoScrollY(e.clientY);
  }

  public get draggedRows(): any[] {

    if (this.uiAction && this.uiAction.target) {
      if (this.uiAction.renderTarget === null) {
        // Первые три записи в обратном порядке
        this.uiAction.renderTarget = [];
        for (let i = 0; i < 3 && i < this.uiAction.target.length; i++) {
          this.uiAction.renderTarget.unshift(this.uiAction.target[i]);
        }
      }
      return this.uiAction.renderTarget;
    }
    return [];
  }

  public getDragTransform(i: number): string  {
    const l = this.draggedRows.length;
    const scale = Math.pow(0.97, l - i - 1);
    const dx = -40;
    const dy = -i * this.state.settings.rowHeight + (l - i - 1) * 7 - 40;
    const res = 'matrix(' + scale + ', 0, 0, 1, ' + dx + ', ' + dy + ')';
    return res;
  }

  public getDragWidth(): string {
    let res = 0;
    this.state.layoutDrag.columns.forEach(c => res += c.width);
    return res + this.state.settings.widthUnit;
  }

  private checkRowDrag(e: MouseEvent): boolean {

    if (!this.state.settings.rowDrag) {
      return false;
    }

    if (this.uiAction.action === UIActionType.ROW_DRAG) {
      // Уже включено
      return false;
    }

    const xx = e.clientX;
    const yy = e.clientY;
    if (Math.abs(xx - this.uiAction.x) > 9 || Math.abs(yy - this.uiAction.y) > 9) {
      this.startDragRows();
      return true;
    }
    return false;
  }

  private startDragRows() {
    this.uiAction.action = UIActionType.ROW_DRAG;
    this.state.setDragItem(this.uiAction);
    this.setDragPosition(this.uiAction);
    this.detectChanges();
    this.dragInProcess(true);
    this.dragItem.nativeElement.style.visibility = 'visible';
  }

  protected specifyDropPosition(pos: RowPosition, rLeft: number, e: MouseEvent): RowPosition {
    return pos;
  }

  protected dropInfo(e: MouseEvent): any {

    let r = RowLayout.rowPosByXY(this.rowLayouts(this.displayedRows), e.clientX, e.clientY, this.state.isTree);
    const rl: RowLayout = r.rl;

    if (!rl) {
      return null;
    }

    const centerRect = this.scroller.centerRect;
    const rd: RowDirective = <RowDirective>rl.rowComponent;
    const rr = rd.firstCellRect();

    r = this.specifyDropPosition(r, rr.left, e);

    const canDrop = this.state.canDrop(this.uiAction.target, rl.rowComponent.row, r.pos);

    let dropTarget = null;
    if (canDrop !== '') {
      dropTarget = rl.rowComponent.row;
      r.pos = canDrop;
    }

    let top = (r.pos !== 'before' ? rl.clientRect.bottom : rl.clientRect.top) - 1;
    let left = rr.left;
    let height = 2;
    let width = rl.clientRect.width - (left - centerRect.left);

    if (r.pos === 'last') {
      left -= this.state.settings.levelIndent;
      width += this.state.settings.levelIndent;
    }

    if (r.pos === 'in') {
      top -= rl.clientRect.height - 3;
      height = rl.clientRect.height - 6;
    }

    if (left < centerRect.left) {
      left = centerRect.left;
    }

    if ((left + width) > rl.clientRect.right) {
      width = rl.clientRect.right - left;
    }

    const rect = new DOMRect(left, top, width, height);

    if (rect.top < centerRect.top - 1 || rect.top >= centerRect.bottom) {
      return null;
    }

    return {
      dropTarget: dropTarget,
      rowPosition: r,
      pos: r.pos,
      markerRect: rect
    };
  }

  protected dragRows(e: MouseEvent): RowPosition {

    if (!this.uiAction.move(e.clientX, e.clientY)) {
      //return null;
    }

    this.setDragPosition(this.uiAction);

    const di = this.dropInfo(e);

    if (di === null || di.dropTarget === null) {
      this.toggleClass(true, 'true-drag-not-allowed');
      this.toggleClass(false, 'true-drag-allowed');
      this.hideMarker();
    } else {
      this.showMarker(di.markerRect.left, di.markerRect.top, di.markerRect.width, di.markerRect.height, true);
      this.toggleClass(false, 'true-drag-not-allowed');
      this.toggleClass(true, 'true-drag-allowed');
    }

    this.scroller.checkAutoScrollY(e.clientY);

    return di ? di.rowPosition : null;
  }

  private endDragRows(e: MouseEvent) {

    this.hideMarker();
    this.scroller.stopAutoScroll();
    this.toggleClass(false, 'true-drag-not-allowed');
    this.toggleClass(false, 'true-drag-allowed');
    this.dragItem.nativeElement.style.visibility = 'hidden';
    this.dragInProcess(false);

    const di = this.dropInfo(e);
    if (di && di.dropTarget) {
      const ce = new RowDragEvent(this.uiAction.target, di.dropTarget, di.pos);
      this.rowDrag.emit(ce);
      if (!ce.isCanceled) {
        this.state.moveRows(this.uiAction.target, di.dropTarget, di.pos);
        this.rowDragged.emit(ce);
      }
    }
  }

  protected documentMouseMove(e: MouseEvent) {

    super.documentMouseMove(e);

    if (this.uiAction) // если что-то началось..
    {
      if (e.clientX === this.uiAction.x && e.clientY === this.uiAction.y) {
        return;
      }

      if (this.checkRowDrag(e)) {
        return;
      }

      if (this.uiAction.action === UIActionType.ROW_DRAG) {
        this.dragRows(e);
      }

      // Продолжаем выделение данных
      if (this.uiAction.action === UIActionType.SELECT) {

        let dt = Date.now();
        let ms = dt - this._lastSel;
        let delay = this.state.IE ? 70 : 0;

        if (ms < delay) {
          // Не так давно обновляли..
          return;
        }

        this._lastSel = Date.now();
        this.doSelect(e);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  // Завершение выделения области
  documentMouseUp(e: MouseEvent) {

    if (this.uiAction.action === UIActionType.ROW_DRAG) {
      // Переставляем.
      this.endDragRows(e);
    }

    if (this.uiAction.action === UIActionType.SELECT) {
      let rr = this.cellByXY(e.clientX, e.clientY);
      if (rr && rr.fieldName !== '') {
        this.state.endSelect(rr, false, e.button);
        this.focus();
      }
    }

    super.documentMouseUp(e);

    this.rowMouseUp.emit(e);

    // Останавливаем автопрокрутку
    this.scroller.stopAutoScroll();
    this.uiAction = null;
  }

  public resizeInProcess(value: boolean) {
    this.toggleClass(value, 'true-resize-in-process');
  }

  public dragInProcess(value: boolean) {
    this.toggleClass(value, 'true-drag-in-process');
  }

  private showMarker(mrX: number, mrY: number, mrW: number, mrH: number, rowDrag: boolean = false) {

    if (rowDrag) {
      // this.dropMarker.nativeElement.style.border = '2px solid rgba(0,0,0,0.0)';
    } else {

    }

    this.dropMarker.nativeElement.style.top = mrY + 'px';
    this.dropMarker.nativeElement.style.left = mrX + 'px';

    this.dropMarker.nativeElement.style.width = mrW + 'px';
    this.dropMarker.nativeElement.style.height = mrH + 'px';

    this.dropMarker.nativeElement.style.visibility = 'visible';
  }

  // Hide marker of REORDERING/RESIZING
  public hideMarker() {
    this.dropMarker.nativeElement.style.visibility = 'hidden';
  }

  proceedToResizeColumn(ui: UIAction) {

    let r0 = this.scroller.clientRect;

    let mrX = ui.x;

    if ((mrX > r0.left) && mrX < r0.right) {
      this.showMarker(mrX, r0.top + 1, 1, r0.height - 2);
    } else {
      this.hideMarker();
    }

    if (ui.x < r0.left) { // листаем влево
      this.scroller.scrollSpeedX = -this.state.st.autoScrollStep;
    } else {
      if (ui.x > r0.right) {
        this.scroller.scrollSpeedX = this.state.st.autoScrollStep;
      } else {
        this.scroller.scrollSpeedX = 0;
      }
    }
  }

  public resizeColumn(e: any) {
    if (e.action === 'start') {
      this.resizeInProcess(true);
      return;
    }
    if (e.action === 'end') {
      this.hideMarker();
      this.resizeInProcess(false);
      return;
    }
    this.proceedToResizeColumn(e.ui);
  }

  private setDragPosition(e: UIAction) {
    const dy = this.state.iOS ? window.pageYOffset : 0;
    this.dragItem.nativeElement.style.left = e.x + e.targetOffsetX + 'px';
    this.dragItem.nativeElement.style.top = dy + e.y + e.targetOffsetY + 'px';
  }

  public isDragColumn() {
    return this._dragColumn;
  }

  private startDragColumn(e: UIAction) {

    if (this.filterPopup && this.filterPopup.visible) {
      this.filterPopup.closePopup();
    }

    this._dragColumn = true;
    this.scroller.prepareAutoScroll();
    this.state.setDragItem(e);

    this.detectChanges('dragColumn');
    this.setDragPosition(e);

    this.dragItem.nativeElement.style.visibility = 'visible';

    this.dragInProcess(true);
  }

  protected commitDrag() {
    this.checkSize();
    this.need_recalc_page = true;
  }

  protected dragColumn(e: UIAction) {
    if (!this._dragColumn) {
      this.startDragColumn(e)
      return;
    }

    this.setDragPosition(e);

    if (Math.abs(e.x - this._drag_x0) < 5 && Math.abs(e.y - this._drag_y0) < 5) {
      return;
    }

    this._drag_x0 = e.x;
    this._drag_y0 = e.y;

    var showMarker = false;

    let dropInfo: any = null;
    this.headerParts.forEach(p => {
      if (p && !dropInfo) {
        dropInfo = p.canDrop(e, showMarker);
      }
    });

    if (dropInfo && !showMarker) {
      if (e.target instanceof ColumnBand) {
        this.state.reorderBand(e.target, dropInfo);
      } else {
        this.state.reorderColumn(e.target, dropInfo, false);
      }
      this.commitDrag();
    }

    let r0 = this.scroller.checkAutoScrollX(e.x);
    // Передаем rectangle
    this.checkParts(e.x, r0, e.target);
  }

  protected dropColumn(e: any) {
    this._dragColumn = false;

    this.scroller.stopAutoScroll();
    this.dragItem.nativeElement.style.visibility = 'hidden';

    let dropInfo: any = null;
    this.headerParts.forEach(p => {
      if (!dropInfo && p) {
        dropInfo = p.canDrop(e, false);
      }
    });

    if (dropInfo) {
      this.state.reorderColumn(e.target, dropInfo);
    } else {
      this.state.fixDrag(e.target);  // Если тащили из панели группировки, то!
    }

    this.state.clearDragItem();
    this.dragInProcess(false);

    // Почему через 100 миллисекунд? Для того,чтобы плавно затухло
    setTimeout(()=> {
      this.state.setLayoutsVisibility();
      this.updatePage('dropColumn', true);
      // Может поменяться ширина центральной части
      this.checkSize();
    }, 100);
  }

  /**
   * Обработка события строки - переключение чекбокса.
   * @param  e Параметры события
   */
  public toggleCheckbox(e: any) {
    this.state.toggleCheck(e.row, e.fieldName);
  }

  public toggleCheckColumn(col: Column) {
    this.state.toggleCheckColumn(col);
  }

  public setAppearance(appearanceClass: string) {
    super.setAppearance(appearanceClass);
    this.dragItem.nativeElement.classList.add(this.state.sta.dragItemClass);
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    protected intl: InternationalizationService,
    protected elementRef: ElementRef,
    protected changeDetector: ChangeDetectorRef,
    protected keyValueDiffers: KeyValueDiffers) {

      super(state, intl, elementRef, changeDetector, keyValueDiffers);

      // Строчка ушла после редактирования...
      this.state.onRowUnfiltered.pipe(takeUntil(this.destroy$)).subscribe(r => {
        setTimeout(() => {
          if (this.state.dataSource.removeResultRow(r)) {
            this.state.updateSelectionIndices();
            this.need_recalc_page = true;
            this.updatePage('rowUnfiltered');
          }
        }, 100);
      });

      // Изменены колонки
      this.state.onColumnsChanged.pipe(takeUntil(this.destroy$)).subscribe(v => {
        this.RC.clear();
        this.checkSize(true);
      });

      // Перетаскивание заголовка колонки
      this.state.onDrag.pipe(takeUntil(this.destroy$)).subscribe(v => this.dragColumn(v));

      // Drop заголовка колонки
      this.state.onDrop.pipe(takeUntil(this.destroy$)).subscribe(v => this.dropColumn(v));

      // Изменение выделения
      this.state.onSelect.pipe(takeUntil(this.destroy$)).subscribe(cellPos => {
        this.refreshSelection(cellPos);
        this.selectionChanged.emit(this.state.selection);
      });

      // Изменение значения
      this.state.onValueChanged.pipe(takeUntil(this.destroy$)).subscribe(v => this.detectChanges('valueChanged'));

      // Включение редактирования
      this.state.onStartEditing.pipe(takeUntil(this.destroy$)).subscribe(v => this.detectChanges('startEditing'));

      // Выключение редактирования
      this.state.onStopEditing.pipe(takeUntil(this.destroy$)).subscribe(returnFocus => {
        this.detectChanges();
        if (returnFocus) {
          this.focus();
        }
      });
  }
}
