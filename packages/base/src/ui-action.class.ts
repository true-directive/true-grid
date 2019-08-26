/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class UIActionType {
  constructor(public name: string) { }
  static CLICK = new UIActionType('CLICK');
  static REORDER_COLUMN = new UIActionType('REORDER_COLUMN');
  static RESIZE_COLUMN = new UIActionType('RESIZE_COLUMN');
  static SELECT = new UIActionType('SELECT');
  static ROW_DRAG = new UIActionType('ROW_DRAG');
}

export class UIAction {

  public initialized = false;

  public x0: number;
  public y0: number;

  public targetWidth: number;

  public targetOffsetX = 0;
  public targetOffsetY = 0;

  public renderTarget: any = null;

  public move(x: number, y: number): boolean {
    if (x !== this.x || y !== this.y) {
      this.x = x;
      this.y = y;
      return true;
    }
    return false;
  }

  constructor(
    public action: UIActionType,
    public target: any,
    public x: number,
    public y: number
  ) {
    this.x0 = x;
    this.y0 = y;
  }
}
