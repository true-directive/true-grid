import { async, inject, TestBed, ComponentFixture } from '@angular/core/testing';
import {
         ElementRef, Renderer2 } from '@angular/core';

import { ScrollerComponent } from '../src/scroller.component';
import { GridStateService } from '../src/grid-state.service';
import { InternationalizationService } from '../src/internationalization/internationalization.service';

import {ScrollerContainer, triggerEvent} from './scroller.component.factory';

class MockElementRef extends ElementRef {
  constructor() { super(null); }
}

describe('Scroller', () => {

//  jasmine.DEFAULT_TIMEOUT_INTERVAL

    let componentFixture: ComponentFixture<ScrollerContainer>;
    let container: ScrollerContainer;
    let intl: InternationalizationService = new InternationalizationService();
    let gridState: GridStateService = new GridStateService(intl);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
              ScrollerComponent,
              ScrollerContainer
            ],
            providers: [
               { provide: 'gridState', useValue: gridState }
            ]
        }).compileComponents().then(() => {
              componentFixture = TestBed.createComponent(ScrollerContainer);
              componentFixture.detectChanges();
              container = <ScrollerContainer>componentFixture.componentInstance;
          })
    }));


    afterEach(function() {
      gridState.settings.showHeader = true;
      gridState.settings.showFooter = true;
      container.stopAutoScroll();
      container.scrollTo(0, 0);
    });

    it('should be defined', () => {
        componentFixture.detectChanges();
        expect(componentFixture).toBeDefined();
      }
    );

    it('Parts should be defined', () => {
      let headerEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridHeader');
      let dataEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridData');
      let footerEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridFooter');
      expect(headerEl).not.toBeNull();
      expect(dataEl).not.toBeNull();
      expect(footerEl).not.toBeNull();
      //done();
    });

    it('Scroll parts', () => {
      gridState.settings.showHeader = true;
      gridState.settings.showFooter = true;
      componentFixture.detectChanges();
      let headerEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridHeader');
      let footerEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridFooter');
      container.scrollTo(10, 10);

      componentFixture.detectChanges();

      expect(container.headerScrollLeft).toBe(10);
      expect(container.footerScrollLeft).toBe(10);
    });

    it('Hide parts', () => {
      gridState.settings.showHeader = false;
      gridState.settings.showFooter = false;
      componentFixture.detectChanges();
      let headerEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridHeader');
      let footerEl:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#gridFooter');
      expect(headerEl).toBeNull();
      expect(footerEl).toBeNull();
    });

    it('Autoscroll', () => {
      container.startAutoScroll();
      expect(container.dataScrollLeft).toBe(10);
      expect(container.dataScrollTop).toBe(10);
      container.stopAutoScroll();
    });

    it('Check autoscroll X < 0', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollX(-100);
      expect(container.scroller.isAutoScroll).toBeTruthy();
    });

    it('Check autoscroll X > W', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollX(10000);
      expect(container.scroller.isAutoScroll).toBeTruthy();
    });

    it('Check autoscroll 0 < X < W', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollX(container.scroller.centerRect.left + 1);
      expect(container.scroller.isAutoScroll).toBeFalsy();
      container.stopAutoScroll();
    });


    it('Check autoscroll X without preparing', () => {
      let res = container.scroller.checkAutoScrollX(-100);
      expect(res).toBeNull();
    });

    it('Check autoscroll X without preparing', () => {
      let res = container.scroller.checkAutoScrollY(-100);
      expect(res).toBeNull();
    });

    it('Check autoscroll Y < 0', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollY(-100);
      expect(container.scroller.isAutoScroll).toBeTruthy();
      container.stopAutoScroll();
    });

    it('Check autoscroll Y > H', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollY(100000);
      expect(container.scroller.isAutoScroll).toBeTruthy();
      container.stopAutoScroll();
    });

    it('Check autoscroll 0 < Y < H', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollY(container.scroller.centerRect.top + 1);
      expect(container.scroller.isAutoScroll).toBeFalsy();
      container.stopAutoScroll();
    });

    it('Check autoscroll 0 < Y < (H - step)', () => {
      container.scroller.prepareAutoScroll();
      container.scroller.checkAutoScrollY(container.scroller.centerRect.bottom - container.scroller.state.settings.autoScrollStep);
      expect(container.scroller.isAutoScroll).toBeFalsy();
      container.stopAutoScroll();
    });

    it('Fix scroll', () => {
      container.scrollTo(-10, 0);
      container.scroller.fixScroll();
      expect(container.dataScrollLeft).toBe(0);
    });

/*
    it('Drag start event should be activated if dragged by handle', (done:any) => {
        let dragElem:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#dragId');
        let handleElem:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#handle');

        expect(dragdropService.dragData).not.toBeDefined();

        triggerEvent(handleElem, 'mousedown', 'MouseEvent');
        triggerEvent(dragElem, 'dragstart', 'MouseEvent');
        componentFixture.detectChanges();
        expect(dragdropService.dragData).toBeDefined();

        triggerEvent(dragElem, 'dragend', 'MouseEvent');
        triggerEvent(handleElem, 'mouseup', 'MouseEvent');
        componentFixture.detectChanges();
        expect(dragdropService.dragData).toBeNull();

        done();
    });

    it('Drag start event should not be activated if dragged not by handle', (done:any) => {
        container.dragEnabled = false;
        componentFixture.detectChanges();

        let dragElem:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#dragId');
        let nonHandleElem:HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#non-handle');

        expect(dragdropService.dragData).not.toBeDefined();
        expect(dragElem.classList.contains(config.onDragStartClass)).toEqual(false);

        triggerEvent(nonHandleElem, 'mousedown', 'MouseEvent');
        triggerEvent(dragElem, 'dragstart', 'MouseEvent');
        componentFixture.detectChanges();
        expect(dragdropService.dragData).not.toBeDefined();
        expect(dragElem.classList.contains(config.onDragStartClass)).toEqual(false);

        done();
    }); */
});
