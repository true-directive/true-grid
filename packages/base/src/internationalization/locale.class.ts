/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class Locale {

  public name: string;
  public shortName: string;

  public shortMonthNames: Array<string> = [];
  public longMonthNames: Array<string> = [];

  public shortDayNames: Array<string> = [];
  public longDayNames: Array<string> = [];

  public firstDayOfWeek = 0;

  public dateFormat: string;
  public timeHMFormat: string;
  public timeHMSFormat: string;
  public dateTimeHMFormat: string;
  public dateTimeHMSFormat: string;

  public separators: Array<string> = [];
  public currency = '';

  public translates: { [id: string]: any } = { };
}
