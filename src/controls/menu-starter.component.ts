/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/

import { Component, Input, Output, ViewChild, EventEmitter } from '@angular/core';

import { MenuAction } from '@true-directive/base';

import { MenuComponent } from './menu.component';

@Component({
  selector: 'true-menu-starter',
  template:  `
    <true-menu #menu
      (show)="show.emit($event)"
      (closed)="menuClosed($event)">
      <true-menu-item
        *ngFor="let t of items; let i=index"
        [true-divide]="isDivide(t)"
        (itemClick)="itemClicked(t)"
        [disabled]="t.disabled"><span [ngClass]="t.icon"></span>{{t.name | trueTranslate}}</true-menu-item>
    </true-menu>
  `
})
export class MenuStarterComponent {

  target: any = null;
  items: MenuAction[] = [];

  @ViewChild('menu')
  menu: MenuComponent;

  @Output('show')
  show: EventEmitter<any> = new EventEmitter<any>();

  @Output('closed')
  closed: EventEmitter<any> = new EventEmitter<any>();

  @Output('itemClick')
  itemClick: EventEmitter<any> = new EventEmitter<any>();

  menuClosed(e: any) {
    this.closed.emit(e);
  }

  itemClicked(item: MenuAction) {
    this.itemClick.emit({target: this.target, action: item})
    this.finish();
  }

  public isDivide(item: MenuAction): boolean {
    const i = this.items.indexOf(item);
    return i > 0 && this.items[i - 1].group !== item.group;
  }

  public start(e: any, items: MenuAction[], target: any) {
    this.finish();
    this.target = target;
    this.items = items;    
    this.menu.showByXY(e.clientX, e.clientY);
  }

  public finish() {
    this.target = null;
    if (this.menu.visible) {
      this.menu.closePopup();
    }
  }
}
