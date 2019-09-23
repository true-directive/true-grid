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
 * Component for displaying links.
 */
@Component({
  selector: 'true-cell-ref',
  template: `<div #content></div>`,
  styles: [`
    :host {
      padding: 0;
    }
    `]
  })
export class CellRefComponent implements ICell {

  @ViewChild('content')
  content: any;

  get ref(): string {
    return this.row[this.column.referenceField];
  }

  value: string;
  event: EventEmitter<any> = new EventEmitter<any>();

  column: Column;
  row: any;
  state: GridStateService;
  disabled: boolean = false;

  /**
   * Found substring's Highlighting
   * @param  v Cell's value
   * @return   Highlighted html
   */
  protected highlight(v: string): string {

    const s = this.state.dataSource.searchString.toLowerCase();
    if (s === '') {
      return v;
    }

    const i = v.toLowerCase().indexOf(s);
    const start = v.substring(0, i);
    const found = v.substring(i, i + s.length);
    const end = v.substring(i + s.length);
    if (i >= 0) {
      return `${start}<span class='true-hl'>${found}</span>${end}`;
    } else {
      return v;
    }
  }

  /**
   * Initialization
   * @param  value Cell's value
   */
  init(value: any) {
    const hl = this.highlight(value);

    let t = ``;
    if (this.column.referenceTarget !== '') {
      t = ` target="${this.column.referenceTarget}"`;
    }

    const a = `<a href="${this.ref}"${t}>${hl}</a>`;
    this.value = a;
    this.content.nativeElement.innerHTML = a;
  }
}
