/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class SummaryType {
  static SUM = new SummaryType('Sum', 'Sum');
  static MIN = new SummaryType('Minimum', 'Min');
  static MAX = new SummaryType('Maximum', 'Max');
  static COUNT = new SummaryType('Count', 'Count');
  static AVERAGE = new SummaryType('Average', 'Avg');
  constructor(public name: string, public shortName: string) { }
}

export class Summary {
  constructor(public type: SummaryType) { }
  public value: any;
}
