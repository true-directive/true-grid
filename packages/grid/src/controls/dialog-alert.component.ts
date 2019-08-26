/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

import { DialogInfo } from './dialog-info.class';

/**
 * Dialog alert component
 */
@Component({
  selector: 'true-dialog-alert',
  templateUrl: 'dialog-alert.component.html',
  styleUrls: ['dialog-alert.component.scss']
})
export class DialogAlertComponent {

  @Input()
  text: string = '';

  @Output()
  close: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('alert')
  alert: any;

  @ViewChild('overlay')
  overlay: any;

  public closeAlert() {
    this.close.emit(null);
  }

  btnClick(e: any, btn: any) {
    this.close.emit(btn);
  }

  overlayClick(e: any) {
    this.close.emit(null);
  }

  dialog: DialogInfo = null;

  init(txt: string, dialog: DialogInfo) {
    this.text = txt;
    this.dialog = dialog;
    setTimeout(() => {
      // Animation
      this.alert.nativeElement.style.transform = 'translateY(0px)';
      this.alert.nativeElement.style.opacity = '1.0';
      this.overlay.nativeElement.style.opacity = '0.4';
    });
  }

  constructor(public elementRef: ElementRef) { }
}
