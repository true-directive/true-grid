/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, ViewChild, ContentChild, Renderer2,
         EventEmitter, ElementRef } from '@angular/core';

import { Utils, Keys, PopupPosition, CloseEvent } from '@true-directive/base';

@Component({
  selector: 'true-popup',
  template:  `
    <div [style.zIndex]="getZ()" class="true-popup"
      (mousedown)="popupMouseDown($event)"
      (touchstart)="popupTouchStart($event)"
      (keydown)="popupKeyDown($event)" #popup>
      <ng-content #content></ng-content>
     </div>`,
  styles: [
    `
    :host > div {
      position: fixed;
      display: none;
      opacity: 0.0;
    }

    .true-modal-overlay {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      opacity: 0.0;
      overflow-y: auto;
    }
    `],
    host: {
      '(touchend)': '$event.stopPropagation()'
    }
})
export class PopupComponent {

  private readonly transform0 = 'translateX(15px)';
  private readonly transform1 = 'translateX(0)';

  public static z: number = 19;
  public static renderToBody = true;

  getZ() {
    return this.zIndex;
  }

  @ViewChild('popup')
  popup: any;

  @Output('close')
  close: EventEmitter<CloseEvent> = new EventEmitter<CloseEvent>();

  @Output('closed')
  closed: EventEmitter<any> = new EventEmitter<any>();

  @Output('show')
  show: EventEmitter<any> = new EventEmitter<any>();

  @Input('position')
  position: 'RELATIVE' | 'ABSOLUTE' | 'MODAL' = 'RELATIVE';

  @Input('keepOnTargetClick')
  keepOnTargetClick = true;

  private zIndex: number;

  private documentContextMenuBound: any;
  private documentMouseDownBound: any;
  private documentTouchStartBound: any;
  private documentScrollBound: any;
  private documentResizeBound: any;

  /**
   * Focus trap
   * Looking for the next element to switch focus.
   * @param  element  Элемент, относительно которого нужно найти следующий
   * @param  backward Поиск назад (Shift+Tab)
   * @param  parent   Родительский, в котором сейчас ищем
   * @param  found    Заданный элемент найден. Берем следующий подходящий
   * @return          Элемент, на который следует перевести фокус
   */
  private getNextElement(
      element: any, //
      backward: boolean = false,
      parent: any = null,
      found: boolean = false
    ): any {

    if (element === null) {
      // Элемент, не задан, ищем первый попавшийся
      found = true;
    }

    if (parent === null) {
      // Родительский элемент не задан, ищем в хосте
      parent =  this.popup.nativeElement;
    }

    for (let i = 0; i < parent.children.length; i++) {
      const el = backward ? parent.children[parent.children.length - i - 1] : parent.children[i];

      if (el.hidden || el.disabled) {
        continue;
      }

      if (el === element) {
        found = true;
        continue;
      }

      if (el.offsetParent === null) {
        continue;
      }

      if (found && el.tabIndex !== -1  && (
               el.nodeName === 'INPUT'
            || el.nodeName === 'BUTTON'
            || el.nodeName === 'SELECT'
            || el.nodeName === 'TEXTAREA'
            || el.tabIndex > 0
        ))  {
        return { found: found, element: el };
      }

      const res = this.getNextElement(element, backward, el, found);
      found = res.found;
      if (res.element) {
        return res;
      }
    }

    return { found: found, element: null };
  }

  popupMouseDown(e: any) {
    if (this.zIndex >= PopupComponent.z) {
      e.stopPropagation();
    }
  }

  popupTouchStart(e: any) {
    e.stopPropagation();
  }

  popupKeyDown(e: any) {

    if (e.keyCode === Keys.ESCAPE)
    {
      this.closePopup();
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.keyCode === Keys.TAB) {
      // Ищем элемент, на который мы можем отправить фокус после target
      let res = this.getNextElement(e.target, e.shiftKey);
      // Не найдено после заданного? Ищем первый
      if (res.element === null) {
        res = this.getNextElement(null, e.shiftKey);
      }

      if (res.element) {
        res.element.focus();
      }

      e.preventDefault();
      e.stopPropagation();
    }
  }

  addDocumentListeners() {

    if (!this.documentContextMenuBound) {
      this.documentContextMenuBound = this.documentContextMenu.bind(this);
    }

    if (!this.documentMouseDownBound) {
      this.documentMouseDownBound = this.documentMouseDown.bind(this);
    }

    if (!this.documentTouchStartBound) {
      this.documentTouchStartBound = this.documentTouchStart.bind(this);
    }

    if (!this.documentScrollBound) {
      this.documentScrollBound = this.documentScroll.bind(this);
    }

    if (!this.documentResizeBound) {
      this.documentResizeBound = this.documentResize.bind(this);
    }

    document.addEventListener('contextmenu', this.documentContextMenuBound, false);
    document.addEventListener('mousedown', this.documentMouseDownBound, false);
    document.addEventListener('touchstart', this.documentTouchStartBound, false);
    window.addEventListener('scroll', this.documentScrollBound, false);
    window.addEventListener('resize', this.documentResizeBound, false);
  }

  removeDocumentListeners() {
    document.removeEventListener('contextmenu', this.documentContextMenuBound, false);
    document.removeEventListener('mousedown', this.documentMouseDownBound, false);
    document.removeEventListener('touchstart', this.documentTouchStartBound, false);
    window.removeEventListener('scroll', this.documentScrollBound, false);
    window.removeEventListener('resize', this.documentResizeBound, false);
  }

  maxZIndex(element: any): number {
    let z: number = 0;
    var parent = element.parentNode;
    while (parent && parent.style) {
      if (!isNaN(parent.style.zIndex) && parent.style.zIndex > z) {
        z = parent.style.zIndex;
      }
      parent = parent.parentNode;
    }
    return +z;
  }

  documentScroll(e: any) {
    this.updatePosition();
  }

  documentResize(e: any) {
    this.updatePosition();
  }

  checkClose(target: any) {
    const l = target;

    if (this._target === l && this.keepOnTargetClick) {
      return;
    }

    if (this._target && Utils.isAncestor(this._target, l) && this.keepOnTargetClick) {
      return;
    }

    if (Utils.isAncestor(this.popup.nativeElement, l)) {
      return;
    } else {
      if (this.zIndex < this.maxZIndex(l)) {
        // Мы кликнули на более высокий уровень
        return;
      }
    }
    this.closePopup();
  }

  documentTouchStart(e: TouchEvent) {
    this.checkClose(e.target);
  }

  documentMouseDown(e: MouseEvent) {
    this.checkClose(e.target);
  }

  documentContextMenu(e: any) {
    this.checkClose(e.target);
  }

  _x = -1;
  _y = -1;
  _target: any;
  _direction: string;
  _visible: boolean = false;

  _overlay: HTMLElement = null;

  public get visible(): boolean {
    return this._visible;
  }

  private makeOverlay(): any {

    PopupComponent.z++
    const zIndex = PopupComponent.z;

    this._overlay = this._renderer.createElement('div');
    this._renderer.setStyle(this._overlay, 'z-index', zIndex);
    this._renderer.addClass(this._overlay, 'true-modal-overlay');
    this._renderer.appendChild(document.body, this._overlay);

    this._renderer.listen(this._overlay, 'touchstart', (e: any) => {
      this.closePopup();
      e.stopPropagation();
      e.preventDefault();
    });

    this._renderer.listen(this._overlay, 'mousedown', (e: any) => {
      this.closePopup();
      e.stopPropagation();
      e.preventDefault();
    });

    setTimeout(() => {
      this._renderer.setStyle(this._overlay, 'opacity', '1.0');
    }, 50);

    return this._overlay;
  }

  private removeOverlay() {
    if (this._overlay) {
      this._renderer.removeChild(document.body, this._overlay);
      PopupComponent.z--;
    }
    this._overlay = null;
  }

  private resetPosition() {
    this.popup.nativeElement.style.top = '0px';
    this.popup.nativeElement.style.left = '0px';
  }

  public updatePosition() {

    if (!this._visible) {
      return;
    }

    if (this._x !== -1 || this._y !== -1) {
      if (PopupComponent.renderToBody) {
        this.popup.nativeElement.style.position = 'fixed';
      }
      this.popup.nativeElement.style.left = this._x + 'px';
      this.popup.nativeElement.style.top = this._y + 'px';
      return;
    }

    if (this.position === 'ABSOLUTE') {
      this.popup.nativeElement.style.position = 'absolute';
      this.popup.nativeElement.style.top = 'unset';
      this.popup.nativeElement.style.left = 'unset';
      return;
    }

    let popupRect = this.popup.nativeElement.getBoundingClientRect();

    if (this.position === 'MODAL') {

      const ww = document.body.clientWidth;

      let width = popupRect.width;
      let modalX = (ww - width) / 2;
      if (modalX <= 10) {
        modalX = 10;
        width = ww - 20;
      }

      this.popup.nativeElement.style.left = modalX + 'px';
      this.popup.nativeElement.style.top = '35px';
      return;
    }

    let targetRect = this._target.getBoundingClientRect();
    let xx = targetRect.left;
    let yy = targetRect.bottom;

    if (this._direction.toLowerCase() === 'left') {
      xx = targetRect.right - popupRect.width + 6;
    }

    if (this._direction.toLowerCase() === 'right') {
      xx = targetRect.right;
      yy = targetRect.top - 6;
    }

    if (yy + popupRect.height > window.innerHeight && this._direction !== 'right') {
      yy = targetRect.top - popupRect.height;
    }

    if (yy + popupRect.height > window.innerHeight && this._direction === 'right')
      yy = targetRect.bottom - popupRect.height + 4;


    if (this._direction.toLowerCase() === 'upleft') {
      xx = targetRect.right - popupRect.width + 6;
      yy = targetRect.top - popupRect.height;
    }

    if (this._direction.toLowerCase() === 'upright') {
      xx = targetRect.left - 6;
      yy = targetRect.top - popupRect.height;
    }

    if (xx + popupRect.width > window.innerWidth) {
      xx = window.innerWidth - popupRect.width - 4;
    } else {
      xx = xx < 0 ? 4 : xx;
    }

    yy = yy < 0 ? 4 : yy;

    this.popup.nativeElement.style.position = 'fixed';
    this.popup.nativeElement.style.left = xx + 'px';
    this.popup.nativeElement.style.top = yy + 'px';
  }

  private display() {
    let t1 = this.transform1;

    if (this._visible) {
      // To prevent the Z-index from being updated during false closures.
      return;
    }

    this._visible = true;

    this.resetPosition();
    setTimeout(() => {
      this.popup.nativeElement.style.display = 'block';
      this.updatePosition();

      if (this.position === 'MODAL') {
        this.makeOverlay();
        this.popup.nativeElement.style.opacity = 0.0;
        this.popup.nativeElement.style.transform = 'translateY(-15px)';
        this.popup.nativeElement.style.position = 'absolute';
        t1 = 'translateY(0)';
        this._overlay.appendChild(this.popup.nativeElement);
      } else {
        this.updatePosition();

        if (this.position === 'RELATIVE' && PopupComponent.renderToBody) {
          this._renderer.removeChild(this.elementRef.nativeElement, this.popup.nativeElement);
          document.body.appendChild(this.popup.nativeElement);
        }
        this.popup.nativeElement.style.transform = this.transform0;
      }

      PopupComponent.z++
      this.zIndex = PopupComponent.z;
      this.popup.nativeElement.style.zIndex = this.zIndex;

      setTimeout(()=> {
        this.popup.nativeElement.style.opacity = 1.0;
        this.popup.nativeElement.style.transform = t1;
      }, 50);
      this.addDocumentListeners();
      this.show.emit();
    });
  }

  public showByXY(x: number, y: number) {
    this._x = x;
    this._y = y;
    this.display();
  }

  public showByTarget(target: any = null, direction: string = '') {
    this._target = target;
    this._direction = direction;
    this.display();
  }

  public closePopup(result: any = null, confirmed: boolean = false) {
    if (!this._visible) {
      return; // Чтобы Z-индекс не обновлялся при ложных закрытиях
    }

    // можно отменить закрытие
    const event = new CloseEvent(result);
    event.confirmed = confirmed;
    this.close.emit(event);
    if (event.isCanceled) {
      return;
    }

    PopupComponent.z--;
    if (PopupComponent.z <= 9) {
      PopupComponent.z = 9;
    }

    if (this.position === 'MODAL') {
      this._overlay.removeChild(this.popup.nativeElement);
      this.elementRef.nativeElement.appendChild(this.popup.nativeElement);
      this.removeOverlay();
    }

    this._visible = false;
    this._target = null;
    this._x = -1;
    this._y = -1;
    this.popup.nativeElement.style.opacity = 0.0;
    this.popup.nativeElement.style.transform = this.transform0;
    this.popup.nativeElement.style.display = 'none';

    if (this.position === 'RELATIVE' && PopupComponent.renderToBody) {
      this._renderer.removeChild(document.body, this.popup.nativeElement);
      this.elementRef.nativeElement.appendChild(this.popup.nativeElement);
    }

    this.resetPosition();
    this.removeDocumentListeners();

    this.closed.emit(result);
  }

  public toggle(target: any, direction: string) {
    if (this._visible) {
      this.closePopup();
    } else {
      this.showByTarget(target, direction);
    }
  }

  constructor(public elementRef: ElementRef, private _renderer: Renderer2) { }
}
