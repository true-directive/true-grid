/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * alx@truedirective.com
 * @link https://truedirective.com/
 * @license MIT
*/
import { Injectable, ChangeDetectorRef, ViewRef, OnDestroy } from '@angular/core';
import { ElementRef } from '@angular/core';
import { UIAction } from '@true-directive/base';

@Injectable()
export abstract class BaseComponent implements OnDestroy {

  protected uiAction: UIAction = null;

  // Слушатели событий документа. Нужны только при перетаскивании колонок и выделении области
  private documentMouseMoveBound: any;
  private documentMouseUpBound: any;

  private touchStartBound: any;
  private touchEndBound: any;
  private touchCancelBound: any;

  protected windowResizeBound: any = null;

  protected touchMoveListenFunc: any = null;
  protected touchEndListenFunc: any = null;
  protected touchCancelListenFunc: any  = null;

  private _touchListener: HTMLElement = null;

  protected addWindowResizeListener() {
    if (!this.windowResizeBound) {
      this.windowResizeBound = this.windowResize.bind(this);
    }

    window.addEventListener('resize', this.windowResizeBound, false);
  }

  protected addDocumentMouseListeners() {
    if (!this.documentMouseMoveBound) {
      this.documentMouseMoveBound = this.documentMouseMove.bind(this);
    }

    if (!this.documentMouseUpBound) {
      this.documentMouseUpBound = this.documentMouseUp.bind(this);
    }

    document.addEventListener('mousemove', this.documentMouseMoveBound, false);
    document.addEventListener('mouseup', this.documentMouseUpBound, false);
  }

  protected removeDocumentMouseListeners() {

    if (this.documentMouseMoveBound) {
      document.removeEventListener('mousemove', this.documentMouseMoveBound, false);
    }

    if (this.documentMouseUpBound) {
      document.removeEventListener('mouseup', this.documentMouseUpBound, false);
    }

    this.documentMouseMoveBound = null;
    this.documentMouseUpBound = null;
  }

  protected addTouchListeners(element: HTMLElement) {
    this.removeTouchListeners();
    this.touchStartBound = this.touchStart.bind(this);
    this.touchEndBound = this.touchEnd.bind(this);
    this.touchCancelBound = this.touchCancel.bind(this);
    element.addEventListener('touchstart', this.touchStartBound, {capture: false, passive: true, once: false});
    element.addEventListener('touchend', this.touchEndBound, {capture: false, passive: true, once: false});
    element.addEventListener('touchcancel', this.touchCancelBound, {capture: false, passive: true, once: false});
    this._touchListener = element;
  }

  protected removeTouchListeners() {
    if (this.touchEndBound) {
      this._touchListener.removeEventListener('touchend', this.touchEndBound, false);
    }

    if (this.touchStartBound) {
      this._touchListener.removeEventListener('touchstart', this.touchStartBound, false);
    }

    if (this.touchCancelBound) {
      this._touchListener.removeEventListener('touchcancel', this.touchCancelBound, false);
    }

    this.touchStartBound = null;
    this.touchEndBound = null;
    this.touchCancelBound = null;
    this._touchListener = null;
  }

  protected removeTouchMoveListeners() {
    // remove previous listeners
    if (this.touchMoveListenFunc) {
      this.touchMoveListenFunc();
    }
    if (this.touchEndListenFunc) {
      this.touchEndListenFunc();
    }
    if (this.touchCancelListenFunc) {
      this.touchCancelListenFunc();
    }
    this.touchMoveListenFunc = null;
    this.touchEndListenFunc = null;
    this.touchCancelListenFunc = null;
  }

  protected windowResize(e: any) { }

  public touchStart(e: any) { }

  public touchEnd(e: any) { }

  public touchCancel(e: any) { }

  protected documentMouseMove(e: MouseEvent) { }

  protected documentMouseUp(e: MouseEvent) {
    this.removeDocumentMouseListeners();
  }

  public canDrop(mouseAction: UIAction, show: boolean): any { }

  public dragInProcess(value: boolean) { }

  public resizeInProcess(value: boolean) { }

  public showHeaderBtn(fieldName: string) { }

  public hideHeaderBtns() { }

  ngOnDestroy() {

    if (this.windowResizeBound) {
      window.removeEventListener('resize', this.windowResizeBound, false);
    }

    this.windowResizeBound = null;

    this.removeDocumentMouseListeners();
    this.removeTouchMoveListeners();
    this.removeTouchListeners();
  }
}
