import {Component, ViewChild, Input, Output, EventEmitter} from '@angular/core';

import { Column, ColumnType, RenderMode, GridSettings } from '@true-directive/base';
import { Keys } from '@true-directive/base';

import { PopupComponent } from '../src/controls/popup.component';
import { GridComponent } from '../src/grid.component';


export function triggerEvent(elem:HTMLElement, eventName:string, eventType:string) {
    var event:Event = document.createEvent(eventType);
    event.initEvent(eventName, true, true);
    elem.dispatchEvent(event);
}

@Component({
  selector: 'test-grid',
  template: `
  <div class="grid-container">
    <true-grid #grid
              style=" height: 200px;"
              [columns]="columns"
              [data]="data"
              [settings]="settings"
              (queryChanged)="queryChanged($event)">
    </true-grid>
  </div>
`,
styles: [`
  .grid-container {
    height: 200px;
  }
  `]
})
export class GridContainer {

    @Output() 
    testOne:EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('grid', {static: true})
    grid: GridComponent;

    private readonly _columns: Column[] = [];

    get columns() {

      if (this._columns.length === 0) {

        this._columns.push(
          new Column('checked', 'Checked', 50, ColumnType.CHECKBOX, 'Data types')
        );
        this._columns.push(
          new Column('booleanValue', 'Boolean', 100, ColumnType.BOOLEAN, 'Data types')
        );
        this._columns.push(
          new Column('dateValue', 'Date', 100, ColumnType.DATETIME, 'Data types', 'date')
        );
        this._columns.push(
          new Column('formatted1', 'Formatted 1', 100, ColumnType.NUMBER, 'Data types', '${D1-4.2}')
        );
        this._columns.push(
          new Column('formatted2', 'Formatted 2', 100, ColumnType.NUMBER, 'Data types', '{D1-4.2} kg')
        );
        this._columns.push(
          new Column('name', 'Name', 100, ColumnType.STRING, 'Data types')
        );

        for (let j = 0; j < 20; j++) {
          const field = `col${j}`;
          const col = new Column(field, field, 120, ColumnType.NUMBER, 'Values');
          this._columns.push(col);
        }
      }
      return this._columns;
    }


    private readonly _data: any[] = [];

    // 100 rows and 20 columns
    get data() {
      if (this._data.length === 0) {

        const date0 = new Date(2019, 0, 1);

        for (let i = 0; i < 100; i++) {
          const row: any = {};
          row.checked = i % 2 > 0;
          row.booleanValue = i % 2 === 0;
          row.dateValue = new Date(2019, 0, 1 + i);
          row.formatted1 = Math.floor(Math.random() * 1000000) / 100.0;
          row.formatted2 = 7000 - Math.floor(Math.random() * 1000000) / 100.0;

          row.name = `row${i}`;

          for (let j = 0; j < 20; j++) {
            const fieldName = `col${j}`;
            row[fieldName] = i * j;
          }
          this._data.push(row);
        }
      }
      return this._data;
    }

    private _settings: GridSettings = null;

    get settings(): GridSettings {
      if (this._settings === null) {
        this._settings = new GridSettings();
        this._settings.rowHeight = 30;
        this._settings.renderMode = RenderMode.VISIBLE;        
      }
      return this._settings;
    }

    get resultRows() {
      return this.grid.resultRows;
    }

    queryChanged(q: any) {

    }

    public processKey(keyCode: number, shift: boolean = false,  ctrl: boolean = false) {
      this.grid.processKey(Keys.generateEvent(
        null,
        keyCode,
        '',
        shift,
        ctrl
      ));
    }

    public columnByField(field: string) {
      return this.columns.find(c => c.fieldName === field);
    }

    private testOneSuccessCallback($event:any) {
        this.testOne.emit($event);
    }

    constructor() {
      PopupComponent.renderToBody = false;
    }
}
