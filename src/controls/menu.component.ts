/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, HostBinding, ContentChildren, QueryList,
         AfterContentInit,
         ViewChildren, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { MenuItemComponent } from './menu-item.component';

@Component({
  selector: 'true-menu',
  template: `
    <true-popup #popup
      [position]="position"
      (closed)="popupClosed($event)"
      (show)="popupShow($event)">
      <div class="true-menu">
        <ng-content></ng-content>
      </div>
    </true-popup>
  `})
export class MenuComponent implements OnDestroy, AfterContentInit {

  @ViewChild('popup')
  popup: any;

  @Output('closed')
  closed: EventEmitter<any> = new EventEmitter<any>();

  @Output('show')
  show: EventEmitter<any> = new EventEmitter<any>();

  @Input()
  position: string = 'RELATIVE';

  @ContentChildren(MenuItemComponent) items: QueryList<MenuItemComponent>;

  _parentMenu: MenuComponent = null;

  popupClosed(e: any) {
    this.closeSubMenus(null);
    this.closed.emit();
  }

  popupShow(e: any) {
    this.show.emit();
  }

  get visible(): boolean {
    return this.popup.visible;
  }

  public showByXY(x: number, y: number) {
    this.popup.showByXY(x, y);
  }

  public showByTarget(target: any = null, direction: string = '', parentMenu: MenuComponent = null) {
    this._parentMenu = parentMenu;
    this.popup.showByTarget(target, direction);
  }

  public togglePopup(target: any = null, direction: string = '', parentMenu: MenuComponent = null) {
    if (!this.visible) {
      this._parentMenu = parentMenu;
      this.popup.showByTarget(target, direction);
    } else
      this.popup.closePopup(target, direction);
  }

  public closeSubMenus(sender: any) {
    this.items.forEach(item => {
      // Закрываем всё, кроме аргумента
      if (item !== sender)
        item.closeSubMenu();
    });
  }

  public closePopup(withParent: boolean = true) {
    if (this._parentMenu !== null && withParent)
      this._parentMenu.closePopup(true);
    this.popup.closePopup();
  }

  _subscription: Subscription;

  private addSubscription(s: Subscription) {
    if (!this._subscription) {
      this._subscription = s;
    } else {
      this._subscription.add(s);
    }
  }

  ngAfterContentInit() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }

    this.items.forEach(item => {
      item.parentMenu = this;
      const sbme = item.onMouseEnter.subscribe(e => this.closeSubMenus(e));
      this.addSubscription(sbme);
      const sbc = item.onClick.subscribe(e => this.closePopup(true));
      this.addSubscription(sbc);
    });
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
