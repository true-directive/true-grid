/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import { GridEvents } from './grid-events.class';
import { GridSelection } from './grid-selection.class';
import { InternationalizationService } from './internationalization/internationalization.service';

import { GridState, GridExporter } from '@true-directive/base';
import { Column } from '@true-directive/base';
import { CellPosition } from '@true-directive/base';
import { DataQuery } from '@true-directive/base';
import { CheckedChangedEvent, ValueChangedEvent, FilterShowEvent } from '@true-directive/base';
import { UIAction } from '@true-directive/base';
import { DOMUtils } from './common/dom-utils.class';
import { AxInject, AxInjectConsumer } from '@true-directive/base';

@Injectable()
// @AxInjectConsumer
export class GridStateService extends GridState implements OnDestroy {

  focusChangedSubscription: any;
  selectionChangedSubscription: any;
  localeChangedSubscription: any;

  @AxInject('events')
  public events: GridEvents;

  @AxInject('selection')
  public selection: GridSelection;

  // Инициируем обновление данных со всеми пересчётами
  public updateDataAsync(): Observable<any> {
    const subject = new Subject<any>();
    if (this.settings.requestData) {
      // Необходимо запросить данные
      this.doQuery(subject);
      // НО! Нужно обновить колонки.
      this.events.columnsChangedEvent();
      return subject;
    }

    // Запрашивать не нужно, считаем всё сами
    // Асинхронное обновление
    this.recalcData().then(() => {
      this.fetchData(new DataQuery(this._dataQueryCounter));
      let rc;
      if (this.dataSource.resultRows) {
        rc = this.dataSource.resultRows.length;
      }
      subject.next(rc);
      subject.complete();
    });

    return subject;
  }

  public copySelectionToClipboard(withHeaders: boolean) {
    DOMUtils.copyToClipboard(this.getSelectedData(this.selection).toString(withHeaders, '\t')
    );
  }

  public exportToCSV(fileName: string, columnSeparator: string = ',') {
    DOMUtils.downloadCSV(fileName, this.dataToExport().toString(true, columnSeparator, true));
  }

  ngOnDestroy() {
    this.focusChangedSubscription.unsubscribe();
    this.selectionChangedSubscription.unsubscribe();
    this.localeChangedSubscription.unsubscribe();
  }

  /*
  // Важно обновить выделенные области в layouts
  protected subscribe() {
    this.events.onSelect.subscribe((cp: CellPosition) => {
      this.layoutsHandler.updateLayoutSelections(cp);
    });
  }
  */
 
  protected registerHandlers() {
    super.registerHandlers();
    this.handlers['events'] = GridEvents;
    this.handlers['selection'] = GridSelection;
  }

  constructor(public internationalization: InternationalizationService) {
    super();

    this.focusChangedSubscription = (<GridSelection>this.selection).onFocusChanged.subscribe(v => {
      this.layoutsHandler.updateLayoutSelections(v);
      this.focusChanged(v);
    });

    // При изменении выделения - обновить в лэйаутах. Но сейчас наоборот
    this.selectionChangedSubscription = (<GridSelection>this.selection).onSelectionChanged.subscribe(v => {
      this.layoutsHandler.updateLayoutSelections(v);
      this.events.selectEvent(v);
    });

    this.localeChangedSubscription = this.internationalization.onLocaleChanged.subscribe(locale => {
      this.dataSource.valueFormatter.setLocale(locale);
    });
  }
}
