/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, ViewChild, ViewChildren, Input, Output, EventEmitter,
         QueryList, OnDestroy,
         ViewContainerRef, ComponentFactoryResolver } from '@angular/core';

import { DialogAlertComponent } from './dialog-alert.component';
import { DialogButton, DialogInfo } from './dialog-info.class';
import { Observable, Observer, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

/**
 * Dialog wrapper component.
 */
@Component({
  selector: 'true-dialog-wrapper',
  templateUrl: 'dialog-wrapper.component.html',
  styleUrls: ['dialog-wrapper.component.scss']
})
export class DialogWrapperComponent implements OnDestroy {

  public closeBtn: DialogButton = new DialogButton(DialogInfo.closeButtonId);

  @Input()
  dialog: DialogInfo = new DialogInfo();

  @Output()
  btnClick: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('alertContainer', { read: ViewContainerRef, static: true })
  alertContainer: any;

  @ViewChildren('buttons')
  public buttons: QueryList<any>;

  get caption(): string {
    return this.dialog ? this.dialog.caption : '';
  }

  _alert: DialogAlertComponent = null;

  public get alertVisible(): boolean {
    return this._alert !== null;
  }

  public focus() {
    setTimeout(()=> {
      this.buttons.first.nativeElement.focus();
    });
  }

  public closeAlert() {
    if (this.alertVisible) {
      this._alert.closeAlert();
    }
  }

  public confirm(txt: string, dialog: DialogInfo): Observable<any> {

    if (this._alert) {
      this._alert.closeAlert();
    }

    const factory = this._cfResolver.resolveComponentFactory(DialogAlertComponent);
    let alert = this.alertContainer.createComponent(factory);
    alert.instance.init(txt, dialog);

    alert.instance.elementRef.nativeElement.style.position = 'absolute';
    alert.instance.elementRef.nativeElement.style.top = '0';
    alert.instance.elementRef.nativeElement.style.left = '0';
    alert.instance.elementRef.nativeElement.style.bottom = '0';
    alert.instance.elementRef.nativeElement.style.right = '0';

    const subject = new Subject<any>();
    alert.instance.close.pipe(take(1)).subscribe((e: any) => {
      subject.next(e);
      subject.complete();

      if (alert) {
        // Close previous alert
        alert.destroy();
        alert = null;
        this._alert = null;
      }
    });

    this._alert = alert.instance;
    return subject;
  }

  ngOnDestroy() {
    if (this._alert) {
      this._alert.closeAlert();
    }
  }

  constructor(private _cfResolver: ComponentFactoryResolver) { }
}
