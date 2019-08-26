/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { MaskSectionType } from './mask-section-type.class';

export class MaskSettings {

  // Autocorrection of section's value. If value entered is bigger than
  // Maximum - replaced with maxValue, if less than minimum - with minValue.
  public autoCorrect = true;

  // On start of input placeholders are added automatically
  public appendPlaceholders = true;

  // Allow values, for which input had not been completed (placeholders are present or length doesn't comply to a mask)
  public allowIncomplete = false;

  // ArrowUp and ArrowDown keys change values to previous and next
  public incDecByArrows = false;

  // If set to true, moving to an icnomplete section with predefined set of values,
  // first value of the set will be entered automatically
  public defaultOptions = true;

  // New type of section can be added
  public sectionTypes: Array<MaskSectionType> = [];

  constructor(
    public placeholder: string,        // Placeholder char
    public replaceMode = true // Replace mode - on carriage position change
                                       // current char is selected
  ) { }
}
