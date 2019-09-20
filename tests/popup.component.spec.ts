import { async, inject, TestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { By } from "@angular/platform-browser";

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Popup&Menu
import { PopupComponent } from '../src/controls/popup.component';

import { PopupContainer, triggerEvent} from './popup.component.factory';

describe('Popup', () => {

    let componentFixture: ComponentFixture<PopupContainer>;
    let container: PopupContainer;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
              PopupComponent,
              PopupContainer
            ]
        }).compileComponents().then(() => {
            componentFixture = TestBed.createComponent(PopupContainer);
            componentFixture.detectChanges();
            container = <PopupContainer>componentFixture.componentInstance;
        })
    }));

    afterEach(function() {
      container.popup.closePopup();
    });


    it('should be defined', () => {
      componentFixture.detectChanges();
      expect(componentFixture).toBeDefined();
    });

    it('show and hide', (done) => {
      PopupComponent.renderToBody = false;
      let target: HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#outerDivForClick');
      let content1: HTMLElement = componentFixture.elementRef.nativeElement.querySelector('.true-popup');

      expect(window.getComputedStyle(content1, null).display).toBe('none');
      container.popup.showByTarget(target, 'right');

      setTimeout(() => {
        expect(window.getComputedStyle(content1, null).display).toBe('block');
        container.popup.toggle(target, 'right');
        setTimeout(() => {
            expect(window.getComputedStyle(content1, null).display).toBe('none');
            done();
        });
      });
    });

    /*
    it('append to the body', (done) => {
      PopupComponent.renderToBody = true;
      let target: HTMLElement = componentFixture.elementRef.nativeElement.querySelector('#outerDivForClick');
      let content0: HTMLElement = componentFixture.elementRef.nativeElement.querySelector('.true-popup');
      expect(window.getComputedStyle(content0, null).display).toBe('none');

      setTimeout(() => {
        let content1: HTMLElement = document.body.querySelector('.true-popup');
        expect(window.getComputedStyle(content1, null).display).toBe('block');
        //container.popup.toggle(target, 'right');
        setTimeout(() => {
          //  expect(window.getComputedStyle(content1, null).display).toBe('none');
            done();
        }, 100);
      },100);
    });
    */
});
