/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, ViewChild,
         Renderer2 } from '@angular/core';

import { Column } from '@true-directive/base';
import { GridStateService } from '../grid-state.service';

import { ICell } from './cell.interface';

/**
 * Component for displaying html content.
 */
@Component({
  selector: 'true-cell-html',
  template: `<div [innerHTML]="value"></div>`,
  styles: [`
    :host {
      padding: 0;
    }
    `]
  })
export class CellHtmlComponent implements ICell {

  value: string;
  event: EventEmitter<any> = new EventEmitter<any>();

  column: Column;
  row: any;
  state: GridStateService;

  init(value: any) {
    this.value = value;
  }
}
