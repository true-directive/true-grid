/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Pipe } from "@angular/core";
import { InternationalizationService } from './internationalization.service';

@Pipe({
  name: 'trueTranslate',
  pure: false
})
export class TranslatePipe {
  transform(value: string): string {
    return this.intl.translate(value);
  }
  constructor(private intl: InternationalizationService) { }
}
