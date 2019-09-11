import { Component, ElementRef, ViewChild, Input, Output, EventEmitter} from '@angular/core';

import { Column, ColumnType, RenderMode, GridSettings } from '@true-directive/base';

import { GridComponent } from '../src/grid.component';
import { ScrollerComponent } from '../src/scroller.component';

export function triggerEvent(elem: HTMLElement, eventName: string, eventType: string) {
    var event: Event = document.createEvent(eventType);
    event.initEvent(eventName, true, true);
    elem.dispatchEvent(event);
}

@Component({
  selector: 'test-scroller',
  template: `
  <div style="width: 200px; height: 100px; background-color:yellow;">
    <true-scroller #scroller>
      <div id="gridHeader" #gridHeader style="width: 400px;" true-header>123</div>
      <div id="gridData" #gridData style="width: 400px; height: 200px;" true-data>456</div>
      <div id="gridFooter" #gridFooter style="width: 400px;" true-footer>789</div>
    </true-scroller>
  </div>
`
})
export class ScrollerContainer {

    @ViewChild('scroller')
    public scroller: ScrollerComponent;

    @Output() testOne:EventEmitter<any> = new EventEmitter<any>();

    private testOneSuccessCallback($event:any) {
        this.testOne.emit($event);
    }

    public scrollTo(x: number, y: number) {
      this.scroller.scrollTo(x, y);
      triggerEvent(this.scroller.scrollerH.nativeElement, 'scroll', 'HTMLEvents');
    }

    public get headerScrollLeft(): number {
      return this.scroller.header.nativeElement.scrollLeft;
    }

    public get footerScrollLeft(): number {
      return this.scroller.footer.nativeElement.scrollLeft;
    }

    public get dataScrollLeft(): number {
      return this.scroller.data.nativeElement.scrollLeft;
    }

    public get dataScrollTop(): number {
      return this.scroller.data.nativeElement.scrollTop;
    }

    public startAutoScroll() {
      this.scroller.startAutoScroll();
      this.scroller.scrollSpeedX = 10;
      this.scroller.scrollSpeedY = 0;
      this.scroller.scrollIfNeeded();
      this.scroller.scrollSpeedX = 0;
      this.scroller.scrollSpeedY = 10;
      this.scroller.scrollIfNeeded();
    }

    public stopAutoScroll() {
      this.scroller.stopAutoScroll();
    }

    constructor(elementRef: ElementRef) { }
}
