/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NgModule, Component, Input, Output, ViewChild, ViewChildren,
         EventEmitter, QueryList, ElementRef, Inject } from '@angular/core';

// Теперь наше
import { GridStateService } from './grid-state.service';
import { GridLayout } from '@true-directive/base';

import { BaseComponent } from './base.component';

@Component({
  selector: 'true-grid-footer',
  templateUrl: './grid-footer.component.html',
  styleUrls: ['./styles/grid-footer.behavior.scss']
})
export class GridFooterComponent extends BaseComponent {

  @Input('layout')
  layout: GridLayout;

  constructor(
    @Inject('gridState') public state: GridStateService,
    private elementRef: ElementRef) {
      super();
  }
}
