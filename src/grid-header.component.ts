/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NgModule, Component, Input, Output, ViewChild, ViewChildren, OnDestroy,
         Renderer2,
         EventEmitter, QueryList, ElementRef, Inject } from '@angular/core';

// Теперь наше
import { ColumnType, GridPart } from '@true-directive/base';
import { UIAction, UIActionType } from '@true-directive/base';

import { Column } from '@true-directive/base';
import { ColumnBand } from '@true-directive/base';

 import { GridLayout } from '@true-directive/base';

import { BaseComponent } from './base.component';
import { ScrollerComponent } from './scroller.component';

import { GridStateService } from './grid-state.service';

import { GridHeaderCellComponent } from './grid-header-cell.component';
import { GridHeaderBandComponent } from './grid-header-band.component';

@Component({
  selector: 'true-grid-header',
  templateUrl: './grid-header.component.html',
  styleUrls: ['./styles/grid-header.behavior.scss']
})
export class GridHeaderComponent extends BaseComponent {

  @Input('layout')
  layout: GridLayout;

  @Input('scroller')
  scroller: ScrollerComponent;

  @Output('resizeColumn')
  resizeColumn = new EventEmitter<{ action: string, ui: UIAction }>();

  @Output('toggleCheckColumn')
  toggleCheckColumn = new EventEmitter<Column>();

  @ViewChild('gridHeaderTable', {static: true})
  gridHeaderTable: any;

  // Маркер, указывающий новую позицию перетаскиваемого столбца
  @ViewChild('dropMarker', {static: true})
  dropMarker: any;  // Пока не используется, т.к. мы на лету переставляем колонку при движении

  @ViewChildren('headerCell', {read: GridHeaderCellComponent}) columnElements: QueryList<GridHeaderCellComponent>;
  @ViewChildren('headerBand', {read: GridHeaderBandComponent}) bandElements: QueryList<GridHeaderBandComponent>;

  private _scrollerClientRect: any = null;

  _touches = false;
  _markerVisible = false;

  public resizeInProcess(value: boolean) {
    if (!this.gridHeaderTable) {
      return;
    }

    if (value) {
      this.gridHeaderTable.nativeElement.classList.add('true-resize-in-process');
    } else {
      this.gridHeaderTable.nativeElement.classList.remove('true-resize-in-process');
    }
  }

  public dragInProcess(value: boolean) {
    if (!this.gridHeaderTable) {
      return;
    }

    if (value) {
      this.gridHeaderTable.nativeElement.classList.add('true-drag-in-process');
    } else {
      this.gridHeaderTable.nativeElement.classList.remove('true-drag-in-process');
    }
  }

  public trackCol(i: number, c: Column) {
    return c;
  }

  //
  get isAutoScroll() {
    if (this.scroller) {
      return this.scroller.isAutoScroll;
    }
    return false;
  }

  resizeMouseUp(e: any) { }

  toggleCheck(e: any, col: Column) {
    this.toggleCheckColumn.emit(col);
  }

  headerCellMouseDown(e: any, col: Column) {
    if (e.button != 0) {
      return;
    }

    const rr = e.target.getBoundingClientRect();
    const xx = Math.round(e.clientX);

    if (xx < rr.left + rr.width / 2) {
      // На самом деле это не перетаскивание, а изменение ширины предыдущей колонки..
      this.resizeMouseDownPrev(e, col);
      return;
    }

    if (xx > rr.left + rr.width / 2) {
      // На самом деле это не перетаскивание, а изменение ширины..
      this.resizeMouseDown(e, col);
      return;
    }
  }

  captionTouchMove(e: any, col: Column) {
    //
    e.stopPropagation();

    const touches = e.changedTouches;
    if (touches.length === 1 && this.uiAction.target === col) {

      const xx = touches[0].clientX;
      const yy = touches[0].clientY;

      if (this.checkReordering(xx, yy)) {
        // Перемещение только инициализировано
        return;
      }

      if (this.uiAction.action === UIActionType.REORDER_COLUMN) {
        this.proceedReordering(xx, yy);
      }
    }
  }

  captionTouchEnd(e: any) {

    this.removeTouchMoveListeners();

    if (this.scroller) {
      this.scroller.stopAutoScroll();
    }

    if (!this.uiAction) {
      return;
    }

    if (this.uiAction && this.uiAction.action === UIActionType.REORDER_COLUMN) {
      this.stopReordering();
    }

    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  captionStartDrag(e: any, col: Column) {

    if (col.isCheckbox) {
      return;
    }

    let xx: number;
    let yy: number;

    if (e.touches) {
      if (!e.changedTouches || e.changedTouches.length !== 1) {
        return;
      }

      xx = e.changedTouches[0].clientX;
      yy = e.changedTouches[0].clientY;

      this.removeTouchMoveListeners();
      this.touchMoveListenFunc = this.renderer.listen(event.target, 'touchmove', (e: any) => {
        this.captionTouchMove(e, col);
      });
      this.touchEndListenFunc = this.renderer.listen(event.target, 'touchend', (e: any) => {
        this.captionTouchEnd(e);
      });
      this.touchCancelListenFunc = this.renderer.listen(event.target, 'touchcancel', (e: any) => {
        this.captionTouchEnd(e);
      });

    } else {
      // Mouse event
      this.addDocumentMouseListeners();
      if (e.button != 0) {
        return;
      }

      xx = e.clientX;
      yy = e.clientY;
    }

    let rr = e.target.parentElement.getBoundingClientRect();

    this.uiAction = new UIAction(UIActionType.CLICK, col, xx, yy);
    this.uiAction.targetOffsetX = rr.left - xx;
    this.uiAction.targetOffsetY = rr.top - yy;

    e.stopPropagation();
  }

  captionSort(e: any, col: Column) {

    if (e.touches) {
      if (!e.changedTouches || e.changedTouches.length !== 1) {
        return;
      }
    } else {
      if (e.button != 0) {
        return;
      }
    }

    if (!this.uiAction) {
      return;
    }

    if (e.defaultPrevented) {
      return;
    }

    if (this.uiAction.target === col && this.uiAction.action === UIActionType.CLICK) {
      if (!col.isCheckbox && col.allowSorting) {
        this.state.sortByColumn(col, e.shiftKey);
        e.stopPropagation();
        e.preventDefault();
      }
      this.uiAction = null;
    }
  }

  resizeMouseDown(e: any, col: Column) {
    if (col.canResize) {
      this.initResizing(e, col);
    }
    e.stopPropagation();
  }

  resizeMouseDownPrev(e: any, col: Column) {
    let realCol = null;
    const ii = this.layout.columns.indexOf(col);

    if (ii > 0) {
      realCol = this.layout.columns[ii - 1];
      this.initResizing(e, realCol);
    }
    e.stopPropagation();
  }

  public showHeaderBtn(fieldName: string) {
    if (!this.columnElements) {
      return;
    }

    this.columnElements.forEach(el => {
      if (el.column.fieldName === fieldName) {
        el.setState('btn-visible');
      }
    });
  }

  public hideHeaderBtns() {
    if (!this.columnElements) {
      return;
    }
    this.columnElements.forEach(el => el.removeState('btn-visible'));
  }

  private get renderedColumns(): any[] {
    const renderedColumns: any[] = [];
    this.columnElements.forEach(el => {
      renderedColumns.push({ boundingRect: el.elementRef.nativeElement.getBoundingClientRect(), item: el.column });
    });
    return renderedColumns;
  }

  private get renderedBands(): any[] {
    const renderedBands: any[] = [];
    this.bandElements.forEach(el => {
      renderedBands.push({ boundingRect: el.elementRef.nativeElement.getBoundingClientRect(), item: el.band });
    });
    return renderedBands;
  }

  /**
   * Проверка позиции при перетаскивании заголовка колонки или бэнда
   * @param  mouseAction Позиция мыши
   * @param  show        Показывать ли маркер
   * @return             [description]
   */
  public canDrop(mouseAction: UIAction, show: boolean): { inColumns: boolean, item: any, pos: string,  } {

    //Здесь нужен прямоугольник родителя..
    if (!this._scrollerClientRect)
      this._scrollerClientRect = this.scroller.clientRect;

    let r0 = this._scrollerClientRect;

    let hasL: boolean = false; // имеется более левая составляющая заголовка
    let hasR: boolean = false; // имеется более правая составляющая

    if (this.layout.place === GridPart.CENTER) {
      r0 = this.scroller.headerRect;
      hasL = this.state.showFixedLeft;
      hasR = this.state.showFixedRight;
    }

    if (this.layout.place === GridPart.LEFT) {
      r0 = this.scroller.headerRectLeft;
      hasL = false;
      hasR = true;
    }

    if (this.layout.place === GridPart.RIGHT) {
      r0 = this.scroller.headerRectRight;
      hasL = true;
      hasR = false;
    }

    const tg = mouseAction.target;

    const isColumn = tg instanceof Column;
    const isBand = tg instanceof ColumnBand;
    let renderedItems: any[];

    if (isColumn) {
      renderedItems = this.renderedColumns;
    } else {
      renderedItems = this.renderedBands;
    }

    return this.layout.canDrop(mouseAction, renderedItems, r0, hasL, hasR, this.state.columnCollection);
  }

  public autoScrollX(dx: number) {
    if (this.uiAction) {
      this.uiAction.x -= dx;
    }
  }

  // Начинаем изменение ширины колонки
  initResizing(e: any, col: Column) {

    if (this.state && !this.state.settings.columnResize) {
      return;
    }

    if (col.columnResize === false) {
      return;
    }

    this.addDocumentMouseListeners();
    this.uiAction = new UIAction(UIActionType.RESIZE_COLUMN, col, e.clientX, e.clientY);
  }

  startResizing() {
    this.uiAction.initialized = true;
    this.scroller.startAutoScroll();
    this.resizeColumn.emit({ action: 'start', ui: this.uiAction });
  }

  initReordering(x: number, y: number) {
    this.uiAction.action = UIActionType.REORDER_COLUMN;
    let ww = this.uiAction.target.headerWidth;
    if (this.uiAction.target instanceof ColumnBand) {
      ww = 0;
      (<ColumnBand>this.uiAction.target).columns.forEach(c => ww += c.displayedWidth);
    }

    if (ww > 300) {
      if (this.uiAction.targetOffsetX < -250)
        this.uiAction.targetOffsetX = -150;
      ww = 300;
    }

    this.uiAction.targetWidth = ww;

    this.uiAction.initialized = true;
    this.uiAction.move(x, y);
    this.state.dragDrop.drag(this.uiAction);
  }

  proceedReordering(xx:number, yy:number) {
    this.uiAction.move(xx, yy);
    this.state.dragDrop.drag(this.uiAction);
  }

  stopReordering() {
    setTimeout(()=> {
      this.state.dragDrop.drop(this.uiAction);
      this.uiAction = null;
    });
  }

  stopActions() {
    if (this.uiAction && this.uiAction.action === UIActionType.REORDER_COLUMN) {
      this.stopReordering();
    }
  }

  /**
   * Проверка необходимости инициализации перестановки колонки
   * @param  xx [description]
   * @param  yy [description]
   * @return    True, если перестановка колонки инициализирована. False - если
   *            инициализация не нужна.
   */
  checkReordering(xx: number, yy: number): boolean {
    if (this.uiAction.action === UIActionType.CLICK && this.state.settings.columnReorder) {
      if (Math.abs(xx - this.uiAction.x) > 6 || Math.abs(yy - this.uiAction.y) > 6) {
        if (this.uiAction.target instanceof Column && (<Column>this.uiAction.target).canReorder) {
          this.initReordering(xx, yy);
          return true;
        }
        if (this.uiAction.target instanceof ColumnBand && this.state.settings.bandReorder) {
          this.initReordering(xx, yy);
          return true;
        }
      }
    }
    return false;
  }

  documentMouseMove(e: MouseEvent) {

    super.documentMouseMove(e);

    if (!this.uiAction) { // если что-то началось..
      return;
    }

    const xx = e.clientX;
    const yy = e.clientY;

    if (this.checkReordering(xx, yy)) {
      return;
    }

    if (this.uiAction.action === UIActionType.REORDER_COLUMN) {
      this.proceedReordering(xx, yy);
    }

    if (!this.uiAction.initialized && this.uiAction.action === UIActionType.RESIZE_COLUMN && this.state.settings.columnResize) {
        this.startResizing();
        return;
    }

    if (this.uiAction.action === UIActionType.RESIZE_COLUMN) {
      this.uiAction.move(xx, yy);
      this.resizeColumn.emit({ action: '', ui: this.uiAction });
    }
  }

  documentMouseUp(e: MouseEvent) {

    super.documentMouseUp(e);

    if (this.scroller) {
      this.scroller.stopAutoScroll();
    }

    let xx = e.clientX;
    let yy = e.clientY;

    if (this.uiAction && this.uiAction.action === UIActionType.REORDER_COLUMN) {
      this.stopReordering();
      e.stopPropagation();
      e.preventDefault();
    }

    if (this.uiAction && this.uiAction.action === UIActionType.RESIZE_COLUMN) {

      let x0 = this.uiAction.x0;
      let x1 = xx;
      let newWidth =  this.uiAction.target.width + x1 - x0;

      if (newWidth < this.state.settings.minColumnWidthOnResize) {
        newWidth = this.state.settings.minColumnWidthOnResize;
      }

      this.state.resizeColumn(this.uiAction.target, newWidth);

      setTimeout(() => {
        this.resizeColumn.emit({ action: 'end', ui: this.uiAction });
        this.scroller.fixScroll(); // Прокрутка может встать в неудобное положение. Чиним.
        this.uiAction = null;
      });
      e.stopPropagation();
      e.preventDefault();
    }
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    private elementRef: ElementRef,
    private renderer: Renderer2
    ) {
      super();
    }
}
