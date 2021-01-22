/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Component, Output, EventEmitter, OnDestroy,
         ComponentFactoryResolver, Inject,
         ViewContainerRef, ChangeDetectorRef,
         ViewChild } from '@angular/core';

import { GridStateService } from '../grid-state.service';
import { Filter } from '@true-directive/base';

@Component({
  selector: 'true-filter-popup',
  template: `
    <true-popup #popup (closed)="popupClosed($event)" (show)="popupShow($event)">
      <template #container></template>
    </true-popup>
  `,
  styles:[`
    div {
      position: relative;
    }
    `]
  })
export class FilterPopupComponent implements OnDestroy {

  @ViewChild('popup', {static: true})
  popup: any;

  @ViewChild('container', { read: ViewContainerRef, static: true })
  container: any;

  @Output()
  closed: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  show: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  setFilter: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  resetFilter: EventEmitter<any> = new EventEmitter<any>();

  get visible(): boolean {
    return this.popup.visible;
  }

  public filter: Filter;

  private _componentRef: any;

  private _subscribes: any[] = [];

  popupClosed(e: any) {
    this.closed.emit(e);
  }

  popupShow(e: any) {
    this.show.emit();
  }

  createComponent(filterComponentType: any, filter: Filter, rows: Array<any>) {
    this.unsubscribeAll();
    this.container.clear();
    const factory = this._cfResolver.resolveComponentFactory(filterComponentType);

    this._componentRef = this.container.createComponent(factory);
    this._componentRef.instance.filter = filter;
    this._componentRef.instance.rows = rows;
    this._componentRef.instance.state = this.state;
    this._componentRef.instance.init();

    let s_closed: any;
    let s_set: any;
    let s_reset: any;

    s_closed = this._componentRef.instance.closed.subscribe((e: any) => this.closePopup());

    s_set = this._componentRef.instance.setFilter.subscribe((e: any) => {
      this.setFilter.emit(e);
      this.closePopup(true);
    });

    s_reset = this._componentRef.instance.resetFilter.subscribe((e: any) => {
      this.resetFilter.emit(e);
      this.closePopup(false);
    });

    this._subscribes.push(s_closed);
    this._subscribes.push(s_set);
    this._subscribes.push(s_reset);
  }

  public showByTarget(target: any, filter: Filter, filterComponentType: any, rows: Array<any>) {
    this.filter = filter;
    this.createComponent(filterComponentType, filter, rows);
    this.popup.showByTarget(target, 'left');
  }

  public closePopup(result: any = null) {
    if (this._componentRef) {
      this._componentRef.destroy();
      this._componentRef = null;
    }
    this.popup.closePopup(result);
  }

  private unsubscribeAll() {
    this._subscribes.forEach(sb => sb.unsubscribe());
    this._subscribes = [];
  }

  ngAfterContentInit() {
    this.unsubscribeAll();
  }

  ngOnDestroy() {
    this.unsubscribeAll();
  }

  public changes() {
    this._changeDetector.detectChanges();
  }

  constructor(
    @Inject('gridState') public state: GridStateService,
    private _cfResolver: ComponentFactoryResolver,
    private _changeDetector: ChangeDetectorRef) { }
}
