/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input,  Output, HostBinding, ContentChildren, QueryList,
         ElementRef, Inject, forwardRef,
         ViewChildren, ViewChild, EventEmitter } from "@angular/core";

import { Observable, Subject } from "rxjs";

@Component({
  selector: "true-menu-item",
  template: `
    <button #button
      [disabled]="disabled"
      [class.true-menu-item_divide]="divide"
      (click)="click($event)"
      (mouseenter)="mouseEnter($event)">
      <div><div><ng-content></ng-content></div><span *ngIf="hasSubmenu()" class="true-submenu true-icon-right-dir"></span></div>
    </button>
  `,
  styles: [`
    button {
      background: none;
      border: none;
      width: 100%;
      text-align: left;
    }

    button > div {
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: baseline;
      flex-wrap: nowrap;
      justify-content: space-between;
      text-align: left;
    }

    .true-submenu {
      flex-grow: 0;
    }

  `],
  host: {
    '[class.true-menu-item_divide]': 'divide',
    'class': 'true-menu-item'
    }
  })
export class MenuItemComponent {

  private _onClick: Subject<any> = new Subject<any>();
  public readonly onClick: Observable<any> = this._onClick.asObservable();

  private _onMouseEnter: Subject<any> = new Subject<any>();
  public readonly onMouseEnter: Observable<any> = this._onMouseEnter.asObservable();

  @Input("true-menu-show")
  submenu: any;

  _divide: boolean = false;

  @Input("true-divide")
  set divide(v: boolean) {
    this._divide = v;
  }

  get divide(): boolean {
    return this._divide;
  }

  @Input("disabled")
  disabled: boolean = false;

  @Output("itemClick")
  readonly onItemClick: EventEmitter<any> = new EventEmitter<any>();

  @Output("itemMouseEnter")
  readonly onItemMouseEnter: EventEmitter<any> = new EventEmitter<any>();

  @Output("needClose")
  readonly onNeedClose: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild("button")
  button: any;

  _parentMenu: any = null;
  public set parentMenu(v: any) {
    this._parentMenu = v;
  }

  click(e: any) {
    this.onItemClick.emit({originalEvent: e, target: this.button.nativeElement });

    // Если есть сабменю, то родительское меню не должно закрываться при клике
    if (!this.hasSubmenu()) {
      this._onClick.next(e);
    }
  }

  mouseEnter(e: any) {
    this._onMouseEnter.next(this);
    this.onItemMouseEnter.emit({ target: this.button.nativeElement, parent: this._parentMenu });
  }

  hasSubmenu() {
    return this.submenu !== undefined;
  }

  closeSubMenu() {
    this.onNeedClose.emit(null);
  }
}
