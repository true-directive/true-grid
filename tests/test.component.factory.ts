import { Inject, Component, EventEmitter, Output } from '@angular/core';
import { GridStateService } from '../src/grid-state.service';

export function triggerEvent(elem:HTMLElement, eventName:string, eventType:string) {
    var event:Event = document.createEvent(eventType);
    event.initEvent(eventName, true, true);
    elem.dispatchEvent(event);
}

@Component({
  selector: 'test-container',
  template: `
  <test-component>
    <div id="testData" test-data>123</div>
  </test-component>
`
})
export class TestContainer {
    @Output() testOne:EventEmitter<any> = new EventEmitter<any>();

    private testOneSuccessCallback($event:any) {
        this.testOne.emit($event);
    }

    constructor(@Inject('gridState') public state: GridStateService) {
      console.log(this.state.settings.rowHeight);
    }

}
