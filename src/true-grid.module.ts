/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";

import { ScrollerComponent } from './scroller.component';
import { GridViewComponent } from './grid-view.component';
import { GridComponent } from './grid.component';
import { GridHeaderComponent } from './grid-header.component';
import { GridHeaderCellComponent } from './grid-header-cell.component';
import { GridHeaderBandComponent } from './grid-header-band.component';
import { GridFooterComponent } from './grid-footer.component';
import { GridFooterCellComponent } from './grid-footer-cell.component';

import { RowDirective } from './row.directive';

// Filters
import { FilterPopupComponent } from './filters/filter-popup.component';

import { FilterTextComponent } from './filters/datatypes/filter-text.component';
import { FilterDateComponent } from './filters/datatypes/filter-date.component';
import { FilterNumberComponent } from './filters/datatypes/filter-number.component';
import { FilterBooleanComponent } from './filters/datatypes/filter-boolean.component';

// Editors
import { EditorTextComponent } from './editors/editor-text.component';
import { EditorSelectComponent } from './editors/editor-select.component';
import { EditorSelectTrueComponent } from './editors/editor-select-true.component';
import { EditorDateComponent } from './editors/editor-date.component';
import { EditorNumberComponent } from './editors/editor-number.component';

// Cells
import { CellHtmlComponent } from './cells/cell-html.component';
import { CellRefComponent } from './cells/cell-ref.component';

// Controls
import { InputWrapperComponent } from './controls/input-wrapper.component';
import { CheckboxWrapperComponent } from './controls/checkbox-wrapper.component';
import { CheckboxComponent } from './controls/checkbox.component';
import { CalendarComponent } from './controls/calendar.component';
import { DatepickerComponent } from './controls/datepicker.component';
import { SelectComponent } from './controls/select.component';
import { DialogWrapperComponent } from './controls/dialog-wrapper.component';
import { DialogAlertComponent } from './controls/dialog-alert.component';

// Popup&Menu
import { PopupComponent } from './controls/popup.component';
import { MenuItemComponent } from './controls/menu-item.component';
import { MenuComponent } from './controls/menu.component';
import { MenuShowDirective } from './controls/menu-show.directive';
import { MenuStarterComponent } from './controls/menu-starter.component';

import { MaskDirective } from './mask/mask.directive';
import { MaskDateDirective } from './mask/mask-date.directive';
import { MaskNumberDirective } from './mask/mask-number.directive';

import { InternationalizationService } from './internationalization/internationalization.service';
import { TranslatePipe } from './internationalization/translate.pipe';

@NgModule({
  imports: [FormsModule, CommonModule],

  providers: [InternationalizationService],

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
    MenuItemComponent, MenuComponent, MenuShowDirective, MenuStarterComponent,

    // Input masking
    MaskNumberDirective, MaskDateDirective, MaskDirective,

    // Translate pipe
    TranslatePipe
  ],

  entryComponents: [FilterTextComponent, FilterDateComponent,
                    FilterNumberComponent, FilterBooleanComponent,

                    EditorTextComponent, EditorSelectComponent,
                    EditorDateComponent, EditorNumberComponent,
                    EditorSelectTrueComponent,

                    CellHtmlComponent, CellRefComponent,

                    DialogAlertComponent,

                    MenuStarterComponent
                  ],

  exports: [
    ScrollerComponent,
    InputWrapperComponent,
    CheckboxWrapperComponent,
    CheckboxComponent,
    DialogWrapperComponent,
    DialogAlertComponent,
    PopupComponent,
    DatepickerComponent,
    CalendarComponent,
    SelectComponent,
    GridViewComponent,
    GridComponent,
    RowDirective,
    GridHeaderComponent,
    GridHeaderCellComponent,
    GridHeaderBandComponent,
    GridFooterComponent,
    FilterPopupComponent,

    MenuComponent,
    MenuItemComponent,
    MenuStarterComponent,

    MaskDirective,
    MaskDateDirective,
    MaskNumberDirective,

    TranslatePipe
  ]
})
export class TrueDirectiveGridModule { }
