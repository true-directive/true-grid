import { Component, ElementRef, ViewChild, Input, Output, EventEmitter} from '@angular/core';

import { PopupComponent } from '../src/controls/popup.component';

export function triggerEvent(elem: HTMLElement, eventName: string, eventType: string) {
    var event: Event = document.createEvent(eventType);
    event.initEvent(eventName, true, true);
    elem.dispatchEvent(event);
}

@Component({
  selector: 'test-popup',
  template: `
  <div style="width: 200px; height: 100px;">
    <true-popup #popup id="popup">
      <div id="popupContent" style="width: 400px; height: 200px;  background-color:yellow;" true-data>456</div>
    </true-popup>
  </div>
  <div id="outerDivForClick" style="width: 100px; height:50px; background-color: red;">123</div>
`
})
export class PopupContainer {

  @ViewChild('popup', {static: true})
  public popup: PopupComponent;

}
