import { async, inject, TestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScrollerComponent } from '../src/scroller.component';
import { GridViewComponent } from '../src/grid-view.component';
import { GridComponent } from '../src/grid.component';
import { GridHeaderComponent } from '../src/grid-header.component';
import { GridHeaderCellComponent } from '../src/grid-header-cell.component';
import { GridHeaderBandComponent } from '../src/grid-header-band.component';
import { GridFooterComponent } from '../src/grid-footer.component';
import { GridFooterCellComponent } from '../src/grid-footer-cell.component';

import { RowDirective } from '../src/row.directive';

// Filters
import { FilterPopupComponent } from '../src/filters/filter-popup.component';

import { FilterTextComponent } from '../src/filters/datatypes/filter-text.component';
import { FilterDateComponent } from '../src/filters/datatypes/filter-date.component';
import { FilterNumberComponent } from '../src/filters/datatypes/filter-number.component';
import { FilterBooleanComponent } from '../src/filters/datatypes/filter-boolean.component';

// Editors
import { EditorTextComponent } from '../src/editors/editor-text.component';
import { EditorSelectComponent } from '../src/editors/editor-select.component';
import { EditorSelectTrueComponent } from '../src/editors/editor-select-true.component';
import { EditorDateComponent } from '../src/editors/editor-date.component';
import { EditorNumberComponent } from '../src/editors/editor-number.component';

// Cells
import { CellHtmlComponent } from '../src/cells/cell-html.component';
import { CellRefComponent } from '../src/cells/cell-ref.component';

// Controls
import { InputWrapperComponent } from '../src/controls/input-wrapper.component';
import { CheckboxWrapperComponent } from '../src/controls/checkbox-wrapper.component';
import { CheckboxComponent } from '../src/controls/checkbox.component';
import { CalendarComponent } from '../src/controls/calendar.component';
import { DatepickerComponent } from '../src/controls/datepicker.component';
import { SelectComponent } from '../src/controls/select.component';
import { DialogWrapperComponent } from '../src/controls/dialog-wrapper.component';
import { DialogAlertComponent } from '../src/controls/dialog-alert.component';

// Popup&Menu
import { PopupComponent } from '../src/controls/popup.component';
import { MenuItemComponent } from '../src/controls/menu-item.component';
import { MenuComponent } from '../src/controls/menu.component';
import { MenuShowDirective } from '../src/controls/menu-show.directive';
import { MenuStarterComponent } from '../src/controls/menu-starter.component';

import { MaskDirective } from '../src/mask/mask.directive';
import { MaskDateDirective } from '../src/mask/mask-date.directive';
import { MaskNumberDirective } from '../src/mask/mask-number.directive';

import { TranslatePipe } from '../src/internationalization/translate.pipe';

import { GridStateService } from '../src/grid-state.service';
import { InternationalizationService } from '../src/internationalization/internationalization.service';

import { SortInfo, SortType, Filter, FilterOperator, SummaryType, Keys, EditorShowMode } from '@true-directive/base';

import {GridContainer, triggerEvent} from './grid.component.factory';

/*
@NgModule({
  declarations: [EditorTextComponent],
  entryComponents: [
    EditorTextComponent,
  ]
})
class TestModule2 {}
*/

describe('Grid', () => {

    let componentFixture: ComponentFixture<GridContainer>;
    let container: GridContainer;
    let intl: InternationalizationService = new InternationalizationService();
    let gridState: GridStateService = new GridStateService(intl);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
              ScrollerComponent, GridComponent, GridViewComponent,
              GridHeaderComponent, GridHeaderCellComponent, GridHeaderBandComponent,
              GridFooterComponent, GridFooterCellComponent,
              RowDirective,

              // Filters
              FilterPopupComponent,
              FilterTextComponent, FilterDateComponent, FilterNumberComponent, FilterBooleanComponent,

              // Editors
              EditorTextComponent, EditorSelectComponent, EditorDateComponent, EditorNumberComponent,
              EditorSelectTrueComponent,

              // Cells
              CellHtmlComponent, CellRefComponent,

              // Controls
              InputWrapperComponent,
              CheckboxWrapperComponent,
              DialogWrapperComponent,
              DialogAlertComponent,
              CheckboxComponent,
              CalendarComponent,
              DatepickerComponent,
              SelectComponent,

              // Popup&Menu
              PopupComponent,
              MenuItemComponent, MenuComponent, MenuShowDirective,

              // Input masking
              MaskNumberDirective, MaskDateDirective, MaskDirective,
              MenuStarterComponent,

              // Translate pipe
              TranslatePipe,

              GridContainer
            ],
            providers: [
               { provide: 'gridState', useValue: gridState },
               InternationalizationService
            ]
        }).overrideModule(BrowserDynamicTestingModule, {
          set: {
            entryComponents: [ EditorTextComponent, FilterBooleanComponent ],
          }
        }).compileComponents().then(() => {
            componentFixture = TestBed.createComponent(GridContainer);
            componentFixture.detectChanges();
            container = <GridContainer>componentFixture.componentInstance;
        })
    }));

    afterEach(function() {
      gridState.settings.showHeader = true;
      gridState.settings.showFooter = true;
      container.columnByField('col1').clearSummaries();
      container.grid.filter([]);
      container.grid.clearSelection();
    });

    it('should be defined', () => {
        componentFixture.detectChanges();
        expect(componentFixture).toBeDefined();
      }
    );

    it('rendered visible rows', () => {
        expect(container.grid.visibleRows.length < 20).toBeTruthy();
      }
    );

    it('sort by column', async(() => {
      container.grid.sort([new SortInfo('col1', SortType.DESC)], false);
      container.grid.updateData(false);
      componentFixture.whenStable().then(() => {
        expect(container.grid.resultRows[0].col1).toBe(99);
      });
    }));

    it('filter by boolean value', async(() => {
      const f: Filter = container.columnByField('booleanValue')
                      .createFilter(true, FilterOperator.EQUALS);
      container.grid.filter([f], false);
      container.grid.updateData(false);
      componentFixture.whenStable().then(() => {
        expect(container.grid.resultRows.length).toBe(50);
      });
    }));

    it('select first row', async(() => {

      const firstRow = container.grid.resultRows[0];
      container.grid.locateRow(firstRow);

      componentFixture.whenStable().then(() => {
        expect(container.grid.state.selection.ranges.length).toBe(1);
      });
    }));

    it('select ranges', async(() => {

      const row1 = container.grid.resultRows[1];
      const row2 = container.grid.resultRows[2];
      const row3 = container.grid.resultRows[3];
      const row4 = container.grid.resultRows[4];

      // First range
      container.grid.startSelect(container.grid.cellPosition(row1, 'name'));
      // End of the first range
      container.grid.proceedToSelect(container.grid.cellPosition(row3, 'col1'));
      // Add second range
      container.grid.startSelect(container.grid.cellPosition(row2, 'booleanValue'), true);
      // End of the second range
      container.grid.proceedToSelect(container.grid.cellPosition(row4, 'col5'));

      componentFixture.whenStable().then(() => {
        expect(container.grid.state.selection.ranges.length).toBe(2);
      });
    }));


    it('summaries', async(() => {

      const col = container.columnByField('col1');
      col.addSummary(SummaryType.MIN);
      container.grid.state.addSummary(col, SummaryType.MAX);
      container.grid.state.addSummary(col, SummaryType.SUM);
      container.grid.state.addSummary(col, SummaryType.AVERAGE);
      container.grid.state.addSummary(col, SummaryType.COUNT);

      componentFixture.whenStable().then(() => {
        expect(col.summaries.length).toBe(5);
        expect(col.summaries[0].value).toBe(0);
        expect(col.summaries[1].value).toBe(99);
        expect(col.summaries[2].value).toBe(4950);
        expect(col.summaries[3].value).toBe(49.5);
        expect(col.summaries[4].value).toBe(100);
      });
    }));


    it('edit', async(() => {
      container.grid.settings.editorShowMode = EditorShowMode.ON_CLICK_FOCUSED;

      container.processKey(Keys.DOWN);
      container.processKey(Keys.RIGHT);
      container.processKey(Keys.RIGHT);
      container.processKey(Keys.RIGHT);
      container.processKey(Keys.RIGHT);
      container.processKey(Keys.RIGHT);
      expect(container.grid.state.focusedCell.fieldName).toBe('name');
      container.processKey(Keys.ENTER);
      const editingCell = container.grid.state.editor;
      expect(editingCell.fieldName).toBe('name');
      container.grid.state.stopEditing(editingCell, true, true);
      expect(container.grid.state.editor).toBeNull();
    }));

    it('keys', async(() => {

      container.processKey(Keys.DOWN);

      expect(container.grid.state.focusedCell.fieldName).toBe('checked');

      container.processKey(Keys.DOWN);
      expect(container.grid.state.focusedCell.row).toBe(container.data[1]);

      container.processKey(Keys.PAGE_UP);
      expect(container.grid.state.focusedCell.row).toBe(container.data[0]);

      container.processKey(Keys.END);

      expect(container.grid.state.focusedCell.fieldName).toBe('col19');
      expect(container.grid.state.focusedCell.row).toBe(container.data[0]);

      container.processKey(Keys.END, false, true);

      expect(container.grid.state.focusedCell.row).toBe(container.data[99]);

    }));

    it('filter show', (done) => {
      let filterBtn: HTMLElement = componentFixture.elementRef.nativeElement.querySelector('.true-grid-btn');
      let booleanFilter: HTMLElement = componentFixture.elementRef.nativeElement.querySelector('.true-filter-boolean__checkboxes');
      expect(booleanFilter).toBeNull();

      triggerEvent(filterBtn, 'click', 'MouseEvent');
      setTimeout(() => {
        let booleanFilter2 = componentFixture.elementRef.nativeElement.querySelector('.true-filter-boolean__checkboxes');
        expect(booleanFilter2).not.toBeNull();
        container.grid.filterPopup.closePopup();
        done();
      }, 100);
    });
});
