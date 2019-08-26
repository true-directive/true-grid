/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/

/**
 * Dialog classes
 */

/**
 * Dialog button info.
 */
export class DialogButton {
  constructor(
    public id: string,
    public caption: string = '',
    public cssClass: string = '',
    public disabled: boolean = false
  ) { }
}

/**
 * Dialog info.
 */
export class DialogInfo {

  static closeButtonId: string = '__ax_btn_close';

  public caption = '...';
  public showHeader = true;
  public showFooter = true;
  public buttons: DialogButton[] = [
    new DialogButton ('ok', 'OK', 'primary', false),
    new DialogButton ('cancel', 'Cancel', 'primary outline', false)
  ];

  public static new(): DialogInfo {
    const di = new DialogInfo();
    di.showHeader = false;
    di.showFooter = false;
    di.buttons = [];
    return di;
  }

  public header(s: string): DialogInfo {
    this.showHeader = true;
    this.caption = s;
    return this;
  }

  public ok(caption: string = 'OK', cssClass: string = 'primary', disabled: boolean = false): DialogInfo {
    this.showFooter = true;
    this.buttons.push(new DialogButton('ok', caption, cssClass, disabled));
    return this;
  }

  public cancel(caption: string = 'Cancel', cssClass: string = 'primary outline', disabled: boolean = false): DialogInfo {
    this.showFooter = true;
    this.buttons.push(new DialogButton('cancel', caption, cssClass, disabled));
    return this;
  }

  public button(id: string, caption: string = 'Btn', cssClass: string = 'primary outline', disabled: boolean = false): DialogInfo {
    this.showFooter = true;
    this.buttons.push(new DialogButton(id, caption, cssClass, disabled));
    return this;
  }
}
