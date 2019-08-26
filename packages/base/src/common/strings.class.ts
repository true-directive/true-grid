/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class Strings {
  public static decorate(s: string, pattern: string, start: string, end: string) {
    const i = s.toLowerCase().indexOf(pattern);
    if (i >= 0) {
      return s.substring(0, i) + start + s.substring(i, i + pattern.length) + end + s.substring(i + pattern.length);
    }
    return s;
  }
}
