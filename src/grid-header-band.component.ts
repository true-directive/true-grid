/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NgModule, Component, Input, Output, ElementRef,
         EventEmitter, Inject } from '@angular/core';

import { GridStateService } from './grid-state.service';
import { ColumnBand } from '@true-directive/base';

@Component({
  selector: 'true-grid-header-band',
  template: `
  <div class="true-header-band__caption" [style.min-height.px]="state.settings.rowHeight"
    (mousedown)="bandMouseDown($event)">
    <div class="true-header-band__txt">
      {{band.caption}}
    </div>
  </div>
  `,
  styles: [`
    .true-header-band__caption {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: stretch;
      overflow-x: hidden;
      overflow-y: hidden;
    }

    .true-header-band__txt
    {
      align-self: center;
      text-overflow: ellipsis;
      overflow-x: hidden;
      overflow-y: hidden;
      flex-grow: 1;
      white-space: nowrap;
    }
`]
})
export class GridHeaderBandComponent {

  @Input('band')
  public band: ColumnBand;

  @Output('bandTouchstart')
  bandTouchstart = new EventEmitter<any>();

  bandMouseDown(e: any) {
    //this.mousedown.emit(e: any);
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    public elementRef: ElementRef) {
      //
  }
}
