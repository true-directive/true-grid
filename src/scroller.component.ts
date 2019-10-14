/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, ViewChild, ChangeDetectorRef,
         ElementRef, Renderer2, Inject, HostBinding,
         EventEmitter } from '@angular/core';
import { timer } from 'rxjs';

import { GridStateService } from './grid-state.service';

@Component({
  selector: 'true-scroller',
  templateUrl: './scroller.component.html',
  styleUrls: ['./styles/scroller.behavior.scss']
})
export class ScrollerComponent {

  @ViewChild('header')
  public header: any;

  @ViewChild('dataArea')
  public dataArea: any;

  @ViewChild('data')
  public data: any;

  @ViewChild('datah')
  public datah: any;

  @ViewChild('footer')
  public footer: any;

  @Input('maxHeight')
  public maxHeight: string = null;

  public get maxHeightU(): string {
    if (this.maxHeight === null) {
      return 'unset';
    }
    return this.maxHeight;
  }

  @Output()
  autoscrollx: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  scroll: EventEmitter<any> = new EventEmitter<any>();

  @HostBinding('class.true-v-scroll')
  get autoWidth() {
    return this.state.settings.columnAutoWidth;
  }

  @HostBinding('class.true-fix-touch')
  get touchFix() {
    return (this.state.iOS || this.state.android) && this.state.settings.enableTouchScroll;
  }

  protected scrollX = 0;
  protected scrollY = 0;
  private scrollTimer: any = null;
  private scrollSubscription: any = null;

  private autoScrollInProgress = false;

  public  scrollSpeedX = 0;
  public  scrollSpeedY = 0;

  protected _scrollRect: any = null;

  public get scrollerH() {
    if (this.touchFix) {
      return this.datah;
    }
    return this.data;
  }

  public get scrollerV() {
    if (this.touchFix) {
      return this.dataArea;
    }
    return this.data;
  }

  public get clientRect(): any {
    return this.elementRef.nativeElement.getBoundingClientRect();
  }

  public get centerRect(): any {
    if (this.touchFix) {
      return this.datah.nativeElement.getBoundingClientRect();
    }
    return this.data.nativeElement.getBoundingClientRect();
  }

  public get headerRect(): any {
    return this.header.nativeElement.getBoundingClientRect();
  }

  public get headerRectLeft(): any {
    return null;
  }

  public get headerRectRight(): any {
    return null;
  }

  dataScroll(e: any) {
    this.doScroll(e);
    this.scroll.emit(e);
  }

  dataScrollH(e: any) {
    this.doScroll(e, true);
    this.scroll.emit(e);
  }

  get isAutoScroll() {
    return this.autoScrollInProgress;
  }

  get scrollTop() {
    if (this.touchFix) {
      return this.dataArea.nativeElement.scrollTop;
    }
    return this.data.nativeElement.scrollTop;
  }

  get scrollLeft() {
    if (this.touchFix) {
      return this.datah.nativeElement.scrollLeft;
    }
    return this.data.nativeElement.scrollLeft;
  }

  get scrollWidth() {
    if (this.touchFix) {
      return this.datah.nativeElement.scrollWidth;
    }
    return this.data.nativeElement.scrollWidth;
  }

  get scrollHeight() {
    return this.data.nativeElement.scrollHeight;
  }

  get viewPortHeight() {
    if (this.touchFix) {
      return this.dataArea.nativeElement.clientHeight;
    }
    return this.data.nativeElement.clientHeight;
  }

  get viewPortWidth() {
    if (this.touchFix) {
      return this.dataArea.nativeElement.clientWidth;
    } else {
      return this.data.nativeElement.clientWidth;
    }
  }

  public prepareAutoScroll() {
    this._scrollRect = this.centerRect;
  }

  public startAutoScroll() {

    if (this.autoScrollInProgress) {
      return;
    }

    if (!this.scrollTimer) {
      this.scrollTimer = timer(this.state.st.autoScrollInterval, this.state.st.autoScrollInterval);
      this.scrollSubscription = this.scrollTimer.subscribe((t: any) => this.scrollIfNeeded());
    }

    this.autoScrollInProgress = true;
  }

  public stopAutoScroll() {
    this._scrollRect = null;
    this.scrollSpeedY = 0;
    this.scrollSpeedX = 0;
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
      this.scrollTimer = null;
    }

    this.autoScrollInProgress = false;
  }

  // Прокрутка при необходимости
  public scrollIfNeeded() {

    const sl = this.scrollLeft;
    const st = this.scrollTop;
    const sw = this.scrollWidth;
    const sh = this.scrollHeight;

    let needSl = sl;
    let needSt = st;

    const r0 = this.elementRef.nativeElement.getBoundingClientRect();

    if (this.scrollSpeedY < 0) {
      // листаем влево
      if (st >= -this.scrollSpeedY) {
        needSt = st + this.scrollSpeedY;
      } else {
        needSt = 0;
      }
    }

    if (this.scrollSpeedY > 0) {
      // листаем вправо
      const maxScrollTop = sh - this.scrollerV.nativeElement.clientHeight;
      if (sl <= (maxScrollTop - this.scrollSpeedY)) {
        needSt = st + this.scrollSpeedY;
      } else {
        needSt = maxScrollTop;
      }
    }

    if (st !== needSt) {
      this.scrollerV.nativeElement.scrollTop = needSt;
      return; // По двум направлениям не будем это делать
    }

    if (this.scrollSpeedX < 0) {
      // листаем влево
      if (sl >= -this.scrollSpeedX) {
        needSl = sl + this.scrollSpeedX;
      } else {
        needSl = 0;
      }
    }

    if (this.scrollSpeedX > 0) {
      // листаем вправо
      const maxScrollLeft = sw - this.scrollerH.nativeElement.clientWidth;
      if (sl <= (maxScrollLeft - this.scrollSpeedX)) {
        needSl = sl + this.scrollSpeedX;
      } else {
        needSl = maxScrollLeft;
      }
    }

    if (sl !== needSl) {
      this.scrollerH.nativeElement.scrollLeft = needSl;
      this.autoscrollx.emit(needSl - sl);
    }
  }

  public scrollTo(x: number, y: number = -1) {
    if (y >= 0) {
      this.scrollerV.nativeElement.scrollTop = y;
    }
    if (x >= 0) {
      this.scrollerH.nativeElement.scrollLeft = x;
    }
  }

  // После сжатия контента возможны отрицательные значения ScrollLeft. Здесь мы
  // проверим и исправим это...
  public fixScroll() {
    if (this.scrollerH.nativeElement.scrollLeft < 0) {
      this.scrollerH.nativeElement.scrollLeft = 0;
    }
  }

  public checkAutoScrollX(xx: number, checkParts: boolean = false): any {

    const r0 = this._scrollRect;

    if (!r0) {
      return null;
    }

    if (xx <= r0.left) {
      // листаем влево
      this.scrollSpeedX = -this.state.st.autoScrollStep;
    } else {
      if (xx >= r0.right) {
        // вправо
        this.scrollSpeedX = this.state.st.autoScrollStep;
      } else {
        this.scrollSpeedX = 0;
      }
    }

    if (this.scrollSpeedX !== 0) {
      this.startAutoScroll();
    }

    return r0;
  }

  public checkAutoScrollY(yy: number): any {
    const r0 = this._scrollRect;
    if (!r0) {
      return null;
    }

    if (yy < r0.top) {
      // листаем вверх
      this.scrollSpeedY = -this.state.st.autoScrollStep;
    } else {
      if (yy > r0.bottom) {
        // вниз
        this.scrollSpeedY = this.state.st.autoScrollStep;
      } else {
        this.scrollSpeedY = 0;
      }
    }

    if (this.scrollSpeedY !== 0) {
      this.startAutoScroll();
    }
  }

  public scrollParts() { }

  doScroll(e: any, h: boolean = false) {
    const l = e.target;

    if ((!this.touchFix || h) && this.scrollX !== l.scrollLeft) {
      this.scrollX = l.scrollLeft;
      if (this.state.settings.showHeader) {
        this.header.nativeElement.scrollLeft = this.scrollX;
      }
      if (this.state.settings.showFooter) {
        this.footer.nativeElement.scrollLeft = this.scrollX;
      }
    }

    if (this.scrollY !== l.scrollTop) {
      this.scrollParts();
    }
  }

  public focus() {
    this.elementRef.nativeElement.focus();
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    protected elementRef: ElementRef,
    protected changeDetector: ChangeDetectorRef,
    protected renderer: Renderer2) { }
}
