/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { MaskSectionValue } from './mask-section-value.class';

export class MaskValue {

  public inSection: boolean;

  public sectionPos: number;

  public before: string;
  public section: MaskSectionValue;
  public delimiter: string;
  public after: string;

  public nextSectionPos(): number {
    return this.before.length + this.section.length + this.delimiter.length;
  }

  public update(s: string, selStart: number): string {
    this.section = new MaskSectionValue(s, this.sectionPos, selStart);
    return this.value();
  }

  public value() {
    return this.before + this.section.value() + this.delimiter + this.after;
  }
}
