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

  @ViewChild('gridHeaderTable')
  gridHeaderTable: any;

  // Маркер, указывающий новую позицию перетаскиваемого столбца
  @ViewChild('dropMarker')
  dropMarker: any;  // Пока не используется, т.к. мы на лету переставляем колонку при движении

  @ViewChildren('headerCell', {read: GridHeaderCellComponent}) columnElements: QueryList<GridHeaderCellComponent>;
  @ViewChildren('headerBand', {read: GridHeaderBandComponent}) bandElements: QueryList<GridHeaderBandComponent>;

  private _scrollerClientRect: any = null;

  _touches = false;
  _markerVisible = false;

  public resizeInProcess(value: boolean) {
    if (!this.gridHeaderTable)
      return;

    if (value)
      this.gridHeaderTable.nativeElement.classList.add('true-resize-in-process');
    else
      this.gridHeaderTable.nativeElement.classList.remove('true-resize-in-process');
  }

  public dragInProcess(value: boolean) {
    if (!this.gridHeaderTable)
      return;

    if (value)
      this.gridHeaderTable.nativeElement.classList.add('true-drag-in-process');
    else
      this.gridHeaderTable.nativeElement.classList.remove('true-drag-in-process');
  }

  //
  get isAutoScroll() {
    if (this.scroller)
      return this.scroller.isAutoScroll;
    return false;
  }

  resizeMouseUp(e: any) { }

  public toggleCheck(e: any, col: Column) {
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
    e.stopPropagation();
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
      if (!col.isCheckbox) {
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

  private inRect(mouseAction: UIAction, rect: any, itemRect: any): boolean {
    let xx = mouseAction.x;
    let yy = mouseAction.y;
    return (xx >= rect.left) && (xx <= rect.right) && (xx >= itemRect.left) && (xx <= itemRect.right);
  }

  // Проверка позиции при перетаскивании заголовка колонки или бэнда
  public canDrop(mouseAction: UIAction, show: boolean): any {

    //Здесь нужен прямоугольник родителя..
    if (!this._scrollerClientRect)
      this._scrollerClientRect = this.scroller.clientRect;

    let r0 = this._scrollerClientRect;

    let hasL: boolean = false; // hasL - имеется более левая составляющая заголовка
    let hasR: boolean = false; // hasR - имеется более правая составляющая

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

    let result = null;
    const tg = mouseAction.target;

    if (mouseAction.y < r0.top) {
      return result;
    }

    const isColumn = tg instanceof Column;
    const isBand = tg instanceof ColumnBand;
    let renderedItems: any[];

    if (isColumn) {
      renderedItems = this.renderedColumns;
    } else {
      renderedItems = this.renderedBands;
    }

    if (renderedItems.length === 0 && mouseAction.x >= r0.left && mouseAction.x < r0.right) {
      return { inColumns: isColumn, item: null, pos: 'left', place: this.layout.place };
    }

    let mrX = 0;
    let cbCol = this.state.columnCollection.prevCheckbox(tg);
    // Необходимо перебрать колонки и понять, сможем ли мы бросить сюда наш заголовок.
    for (let i=0; i < renderedItems.length; i++) {

      const isFirst = i === 0;
      const isLast = i === renderedItems.length - 1;

      let rr = renderedItems[i].boundingRect;
      let item = renderedItems[i].item;

      if (this.inRect(mouseAction, r0, rr)) {

        // проверяем, можно ли вставить колонку сюда..
        let canDropLeft = true;
        let canDropRight = true;

        if (isColumn && tg.fieldName === item.fieldName) {
          // Навели на себя же
          canDropLeft = false;
          canDropRight = false;
        }

        if (cbCol && cbCol.fieldName === item.fieldName) {
          // Навели на чекбокс, который прилеплен к перетаскиваемой колонке
          canDropLeft = false;
          canDropRight = false;
        }

        if (item.isCheckbox && i < renderedItems.length - 1)
          canDropRight = false; // между чекбоксом и норм столбцом не вклиниваемся

        // Не самый первый элемент
        if (!isFirst) {

          const prevItem = renderedItems[i - 1].item;

          // Простая проверка - для колонки
          if (isColumn && prevItem.fieldName === tg.fieldName) {
            canDropLeft = false;
          }

          if (isColumn && prevItem.isCheckbox) {
            if (cbCol && cbCol.fieldName === prevItem.fieldName) {
              canDropLeft = false;
            }
          }

          if (isBand && tg.columns[tg.columns.length - 1].fieldName === prevItem.columns[prevItem.columns.length - 1].fieldName) {
            canDropLeft = false;
          }
        }

        // Бэнд
        if (isBand) {
          // Нельзя бросить бэнд слева от себя
          if (tg.columns[0].fieldName === item.columns[0].fieldName) {
            canDropLeft = false;
          }

          // Нельзя бросить справа от себя
          if (tg.columns[tg.columns.length - 1].fieldName === item.columns[item.columns.length - 1].fieldName) {
            canDropRight = false;
          }

          //
          if (tg.columns[0].fieldName === item.columns[item.columns.length - 1].fieldName) {
            canDropRight = false;
          }

          if (tg.columns[tg.columns.length - 1].fieldName === item.columns[0].fieldName) {
            canDropLeft = false;
          }
        }

        // Не последний элемент
        if (!isLast) {

          const nextItem = renderedItems[i + 1].item;
          if (isColumn && nextItem.fieldName === tg.fieldName) {
            canDropRight = false;
          }

          if (isBand && tg.columns[0].fieldName === nextItem.columns[0].fieldName) {
            canDropRight = false;
          }

          if (isColumn && nextItem.isCheckbox) {
            if (cbCol && cbCol.fieldName === nextItem.fieldName) {
              canDropRight = false;
            }
          }
        }

        // Если мы вписываемся в наш компонент, то показываем сразу..
        // Иначе нам нужно скрыть и немного проскроллить..
        let showMarker = false;

        if ((mouseAction.x - rr.left < rr.width / 2 || item.isCheckbox) && canDropLeft) {

          if (i > 0 && renderedItems[i - 1].item.isCheckbox) {
              // Колонка с чекбоксом неразделимы
              item = renderedItems[i - 1].item;
              rr =  renderedItems[i - 1].boundingRect;
          }

          mrX = rr.left - 1;
          showMarker = true;
          result = { inColumns: isColumn, item: item, pos: 'left' };
        } else
          if (mouseAction.x - rr.left >= rr.width / 2 && canDropRight) {
            mrX = rr.right - 1;
            showMarker = true;
            result = { inColumns: isColumn, item: item, pos: 'right' };
          }

        // Возможно, этот метод вызван с show=false. Тогда мы даже не думаем про маркер.
        if (!show) {
          // this.hideMarker();
          return result;
        }

        // Если выходим за границы и прокрутка = 0 - показываем чуть правее.. Эстетичнее.
        if (mrX < r0.left && rr.left >= r0.left) {
          mrX = r0.left;
        }

        if (mrX === r0.right - 1) {
           mrX = r0.right - 3;
        } else {
          if (mrX === r0.right - 2) {
            mrX = r0.right - 4;
          }
        }

        if (mrX < r0.left && hasL) {
          showMarker = false;
        }

        if (mrX > r0.right && hasR) {
          showMarker = false;
        }

        if ((mrX >= r0.left) && mrX < r0.right && showMarker && show) {
        //  this.showMarker(mrX, rr.top, 3, rr.height);
        }
        else {
          result = null;
        }
      }
    }

    return result;
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
    this.state.drag(this.uiAction);
  }

  proceedReordering(xx:number, yy:number) {
    this.uiAction.move(xx, yy);
    this.state.drag(this.uiAction);
  }

  stopReordering() {
    setTimeout(()=> {
      this.state.drop(this.uiAction);
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

    if (this.scroller)
      this.scroller.stopAutoScroll();

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
