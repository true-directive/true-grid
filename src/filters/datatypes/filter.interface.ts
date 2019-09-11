/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Filter } from '@true-directive/base';
import { GridState } from '@true-directive/base';

export interface IFilter {

  state: GridState;
  filter: Filter;
  rows: Array<any>;

  init(): void;
  validate(): boolean;
}
