/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Directive, Input, ElementRef, Inject, forwardRef } from '@angular/core';
import { MenuComponent } from './menu.component';

@Directive({
    selector: '[true-menu-show]',
    host: {
      '(click)': 'click($event)',
      '(itemMouseEnter)': 'itemMouseEnter($event)',
      '(needClose)': 'needClose($event)',
    }
})
export class MenuShowDirective {

  @Input('true-menu-show')
  menu: MenuComponent;

  isMenuItem: boolean = false;

  click(e: any) {
    if (!this.isMenuItem) {
      this.menu.showByTarget(e.target);
    }
    e.preventDefault();
  }

  closePopup() {
    this._elementRef.nativeElement.classList.remove('true-submenu-visible')
    this.menu.closeSubMenus(null);
    this.menu.closePopup(false);
  }

  itemMouseEnter(e: any) {
    if (this.isMenuItem) {
      this.menu.showByTarget(e.target, 'right', e.parent);
      this._elementRef.nativeElement.classList.add('true-submenu-visible');
    }
  }

  needClose(e: any) {
    this.closePopup();
  }

  ngOnInit() {
    if (this._elementRef.nativeElement.classList.contains('true-menu-item')) {
      this.isMenuItem = true;
    }
  }

  constructor(private _elementRef: ElementRef) { }
}
