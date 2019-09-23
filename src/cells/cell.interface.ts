/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { EventEmitter } from '@angular/core';

import { Column } from '@true-directive/base';

import { GridStateService } from '../grid-state.service';

/**
 * Interface for cell's components.
 */
export interface ICell {
  // Any event which happened in a cell
  event: EventEmitter<any>;

  // Cell's column
  column: Column;

  // A row containing this cell
  row: any;

  // Grid's state
  state: GridStateService;

  //
  disabled: boolean;

  /**
   * Cell's initialization
   * @param value Current value of a cell
   */
  init(value: any): void;
}
