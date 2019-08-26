/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class MaskSectionType {
  public selectors: Array<string> = [];
  public numeric = false;
  public min?: number = null;
  public max?: number = null;
  public options?: Array<string>;

  public regExp?: RegExp;

  // Can be useful if section is not integer
  public minL?: number = null;
  public maxL?: number = null;

  // Which part of the date is represented with this section
  //  d - day
  //  m - month
  //  y - year
  //  h - hour (0 - 12)
  //  H - hour (0 - 24)
  //  mi - minutes
  //  s - seconds
  //  ms - milliseconds
  public datePart?: string = null;
}
