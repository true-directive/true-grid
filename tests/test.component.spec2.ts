import { async, inject, TestBed, ComponentFixture } from '@angular/core/testing';
import { ElementRef, Renderer2 } from '@angular/core';

import { TestComponent } from '../src/test.component';
import { GridStateService } from '../src/grid-state.service';
import { InternationalizationService } from '../src/internationalization/internationalization.service';

import { TestContainer, triggerEvent} from './test.component.factory';

describe('Test', () => {


    let componentFixture: ComponentFixture<TestContainer>;
    let container: TestComponent;
    let intl: InternationalizationService = new InternationalizationService();
    let gridState: GridStateService = new GridStateService(intl);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
              TestComponent,
              TestContainer
            ],
            providers: [{ provide: 'gridState', useValue: gridState }]
        }).compileComponents().then(() =>// { async(() =>
          {
          //
          //inject([GridStateService],
            //  (state: GridStateService) => {
              componentFixture = TestBed.createComponent(TestContainer);
              componentFixture.detectChanges();
              container = <TestContainer>componentFixture.componentInstance;
            //});
          //  })
          }
        )
    }));


    it(' should be defined', (done:any) => {
        expect(container).toBeDefined();
        done();
    });

});
