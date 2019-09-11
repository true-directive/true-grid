# TrueDirective Grid

TrueDirective Grid is a fast and fully functional good-looking visualizer of the data in Angular applications.

[![license](https://img.shields.io/github/license/true-directive/true-grid)](https://github.com/true-directive/true-grid/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/@true-directive/grid)](https://npmjs.com/package/@true-directive/grid)
[![Build Status](https://travis-ci.org/true-directive/true-grid.svg?branch=master)](https://travis-ci.org/true-directive/true-grid)
[![Known Vulnerabilities](https://snyk.io/test/github/true-directive/true-grid/badge.svg?targetFile=package.json)](https://snyk.io/test/github/true-directive/true-grid?targetFile=package.json)


#### [Demo](https://truedirective.com/demo)
#### [Documentation](https://truedirective.com/docs)

![Screenshot](https://truedirective.com/assets/test-grid3.gif)

Main features:
- Two dimensional scrolling.
- Data [sorting](https://truedirective.com/docs/data-sorting) and [filtering](https://truedirective.com/docs/data-filtering).
- Keyboard interaction.
- [Selection](https://truedirective.com/docs/selection) of data ranges.
- Data autoscrolling on navigation and selection.
- [Data summaries](https://truedirective.com/docs/data-summaries).
- Internationalization.

**TrueDirective Grid** package contains all necessary classes for [formatted](https://truedirective.com/docs/formatting-values) displaying and editing of dates and numbers. Multiline cells will be displayed quickly and flawlessly due to table-based html layout.

## Installation

```
npm install @true-directive/grid --save
```

## Usage

### 1. Import @true-directive/grid module

Edit the file *app.module.ts* by adding two lines:

``` ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { TrueDirectiveGridModule } from '@true-directive/grid';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TrueDirectiveGridModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 2. Include icons and theme into the project

Icons are used for some interface elements of the grid. They should be imported  by adding this line into the file *styles.scss*:

``` css
@import "@true-directive/grid/icons/css/true-icons.css";
```

To define your grid's appearance use one of the preinstalled themes also importing it:

``` css
@import "@true-directive/grid/themes/compiled/theme-light.scss";
```

Or

``` css
@import "@true-directive/grid/themes/compiled/theme-dark.scss";
```

> Theme contains styles for the grid and used controls (inputs, buttons). You can import only styles of the grid without controls' styles so that interface elements correspond to your project styles. For further information see in [Features / Themes](https://truedirective.com/docs/themes).

To improve the font of your sample let's add these lines at the end of the same file:

``` css
body, input, button {
  font-family: "Open Sans", sans-serif;
  font-size: 10pt;
}
```

### 3. Use GridComponent

In order to add the grid into the template of the AppComponent use `true-grid` selector. The list of [columns](https://truedirective.com/docs/columns) and [data](https://truedirective.com/docs/data-binding) should be passed in `columns` and `data` attributes respectively.

Edit *app.component.ts*:


``` ts
import { Component } from '@angular/core';

// Import necessary classes
import * as TD from '@true-directive/grid';

@Component({
  selector: 'app-root',
  // Pass the list of columns and data to be displayed in the form of grid
  template: `<true-grid [columns]="columns" [data]="data"></true-grid>`,
  styleUrls: []
})
export class AppComponent {

  // Define the list of columns
  columns: TD.Column[] = [
    new TD.Column('publisher'),
    new TD.Column('name'),
    new TD.Column('weight'),
    new TD.Column('flying'),
    new TD.Column('regeneration')
  ];

  // Define the data
  data: any[] = [
    { publisher: 'Marvel comics', name: 'Spider-Man', weight: 76, flying: false, regeneration: true },
    { publisher: 'Marvel comics', name: 'Iron Man', weight: 90, flying: true, regeneration: false },
    { publisher: 'Marvel comics', name: 'Thor', weight: 290, flying: true, regeneration: true },
    { publisher: 'DC comics', name: 'Batman', weight: 95, flying: false, regeneration: false },
    { publisher: 'DC comics', name: 'Superman', weight: 107, flying: true, regeneration: true },
    { publisher: 'DC comics', name: 'Wonder Woman', weight: 75, flying: true, regeneration: false }
  ];
}

```

Run the project by executing the command ```ng serve --port=3001 --open```. If everything is done properly you'll see the following after you run the project:

![Result 1](https://truedirective.com/assets/test-grid-1.png)

You will see available features such as:
- column reordering
- column resizing
- filters
- sorting
- range selection
- keyboard navigation

### 4. Define columns' data types and properties

Main properties of columns can be set on creation:

``` ts
export class Column {
  constructor(
    public fieldName: string,
    public caption: string = null,
    public width: number = 150,
    public type: ColumnType = ColumnType.STRING,
    public band = '',
    public format = '') { ... }
    ...
}
```

Change *app.component.ts*:

``` ts
import { Component } from '@angular/core';

// Import necessary classes
import * as TD from '@true-directive/grid';

@Component({
  selector: 'app-root',
  // Pass the list of columns and data to be displayed in the form of grid
  template: `<true-grid [columns]="columns" [data]="data"></true-grid>`,
  styleUrls: []
})
export class AppComponent {

  // Define the list of columns
  columns: TD.Column[] = [
    new TD.Column('publisher', 'Publisher', 150, TD.ColumnType.STRING, 'Hero'),
    new TD.Column('name', 'Name', 150, TD.ColumnType.STRING, 'Hero'),
    new TD.Column('weight', 'Weight', 120, TD.ColumnType.NUMBER, 'Specifications', '{D1-4.2} kg'),
    new TD.Column('flying', 'Flying', 120, TD.ColumnType.BOOLEAN, 'Specifications'),
    new TD.Column('regeneration', 'Regeneration', 120, TD.ColumnType.BOOLEAN, 'Specifications')
  ];

  // Define the data
  data: any[] = [
    { publisher: 'Marvel comics', name: 'Spider-Man', weight: 76, flying: false, regeneration: true },
    { publisher: 'Marvel comics', name: 'Iron Man', weight: 90, flying: true, regeneration: false },
    { publisher: 'Marvel comics', name: 'Thor', weight: 290, flying: true, regeneration: true },
    { publisher: 'DC comics', name: 'Batman', weight: 95, flying: false, regeneration: false },
    { publisher: 'DC comics', name: 'Superman', weight: 107, flying: true, regeneration: true },
    { publisher: 'DC comics', name: 'Wonder Woman', weight: 75, flying: true, regeneration: false }
  ];
}

```

The results of the changes you made can be found in the browser:

- the width of each column is explicitly defined
- columns' bands (groups of columns)
- displaying the column data correspondingly to its type
- formatting numeric values before displaying (two digits after decimal separator and postfix)

![Result 1](https://truedirective.com/assets/test-grid-2.png)

### 5. Defining of settings and getting totals of column data

Settings can be passed in ```settings``` input property of GridComponent. Parameters of settings are responsible for the most of grid's behavior and appearance.

Edit *app.component.ts*:

``` ts
import { Component } from '@angular/core';

// Import necessary classes
import * as TD from '@true-directive/grid';

@Component({
  selector: 'app-root',
  // Pass the list of columns and data to be displayed in the form of grid
  template: `<true-grid [columns]="columns" [data]="data" [settings]="gridSettings"></true-grid>`,
  styleUrls: []
})
export class AppComponent {

  // Define the list of columns
  columns: TD.Column[] = [
    new TD.Column('publisher', 'Publisher', 150, TD.ColumnType.STRING, 'Hero'),
    new TD.Column('name', 'Name', 150, TD.ColumnType.STRING, 'Hero'),
    new TD.Column('weight', 'Weight', 120, TD.ColumnType.NUMBER, 'Specifications', '{D1-4.2} kg'),
    new TD.Column('flying', 'Flying', 120, TD.ColumnType.BOOLEAN, 'Specifications'),
    new TD.Column('regeneration', 'Regeneration', 120, TD.ColumnType.BOOLEAN, 'Specifications')
  ];

  // Define the data
  data: any[] = [
    { publisher: 'Marvel comics', name: 'Spider-Man', weight: 76, flying: false, regeneration: true },
    { publisher: 'Marvel comics', name: 'Iron Man', weight: 90, flying: true, regeneration: false },
    { publisher: 'Marvel comics', name: 'Thor', weight: 290, flying: true, regeneration: true },
    { publisher: 'DC comics', name: 'Batman', weight: 95, flying: false, regeneration: false },
    { publisher: 'DC comics', name: 'Superman', weight: 107, flying: true, regeneration: true },
    { publisher: 'DC comics', name: 'Wonder Woman', weight: 75, flying: true, regeneration: false }
  ];

  private _settings: TD.GridSettings = null;
  get gridSettings() {

    if (this._settings === null) {
      const s = new TD.GridSettings();
      // Minimal height of row will be 30px
      s.rowHeight = 30;
      // Only whole rows can be selected by the user
      s.selectionMode = TD.SelectionMode.ROW;
      // Allow user to edit cell value by clicking on the focused cell
      s.editorShowMode = TD.EditorShowMode.ON_CLICK_FOCUSED;
      // Hide horizontal lines
      s.appearance.horizontalLines = false;
      this._settings = s;
    }
    return this._settings;
  }

  constructor() {
    // Sum up third column's values (hero's weight)
    this.columns[2].addSummary(TD.SummaryType.SUM);
  }
}
```

After reloading page in browser we will see the following changes:
- different appearance
- aggregated weight of heroes
- availability to edit any cell values

![Result 3](https://truedirective.com/assets/test-grid-3.png)

Editing of weight values limited by given pattern:  
- number of digits in integer part should not be more than 4
- 2 digits after decimal point
- ```kg``` postfix

### 6. View customization

To make the TrueDirective Grid correspond to the design of your application you are free to change some of the styles.

You can modify the file cointaining one of grid's themes. But it's easier to predefine some parameters before theme's import inside the file *style.scss*.

For example let's change some colors and borders. Edit *styles.scss*:

``` css
/* Accent color */
$axAccent: #d870a1;

/* Outer borders of the grid */
$axOuterBorder: 2px solid #e1e2e3;

/* Header's borders */
$axHeaderHorizontalBorder: 1px solid #e1e2e3;
$axHeaderVerticalBorder: 1px solid #e1e2e3;
$axHeaderOuterBorder: 0;

/* Header's text */
$axHeaderFontWeight: 400;
$axHeaderColor: #333;

/* Header's background color */
$axHeaderBackColor: #f3f5f7;

/* Background color of a selected row */
$axRowSelectedColor: #fff;
$axRowSelectedBackColor: #bb4e82;
$axRowSelectedBorderColor: #bb4e82;

/* Background color of a focused cell */
$axCellFocusedBackColor: #d870a1;

/* Data cells' borders */
$axDataVerticalBorder: 1px solid #e1e2e3;

/* Change the imported file to theme-light.scss */
@import "@true-directive/grid/themes/theme-light.scss";

/* After that without any changes... */
@import "@true-directive/grid/icons/css/true-icons.css";

body, input, button {
  font-family: "Open Sans", sans-serif;
  font-size: 10pt;
}
```

Result:

![Result 5](https://truedirective.com/assets/test-grid-5.png)

### 7. Providing Observable object as data source and settings of the grid's height.

Let's create file *heroe.model.ts* in folder */src/app* of the project:

``` ts
export class HeroModel {
  public publisher: string;
  public name: string;
  public weight: number;
  public flying: boolean;
  public regeneration: boolean;

  // Link to the publisher's info
  public publisherUrl: string;
}
```

Import `HttpClientModule` in your AppModule. Edit *app.module.ts*:

``` ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { TrueDirectiveGridModule } from '@true-directive/grid';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [  
    BrowserModule, TrueDirectiveGridModule, HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Edit *app.component.ts*:

``` ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';

import * as TD from '@true-directive/grid';

// Import model
import { HeroModel } from './hero.model';

@Component({
  selector: 'app-root',
  template: `<true-grid class="test-grid"
                        [columns]="columns"
                        [data]="data"
                        [settings]="gridSettings"></true-grid>`,

  // Set the grid's height
  styles: [`
    .test-grid {
      height: 420px;
    }`]
})
export class AppComponent {

  private _columns = null;
  get columns(): TD.Column[] {
    if (this._columns === null) {
      this._columns = [
        new TD.Column('publisher', 'Publisher', 150, TD.ColumnType.REFERENCE, 'Hero'),
        new TD.Column('name', 'Name', 150, TD.ColumnType.STRING, 'Hero'),
        new TD.Column('weight', 'Weight', 120, TD.ColumnType.NUMBER, 'Specifications', '{N1-4.2} kg'),
        new TD.Column('flying', 'Flying', 120, TD.ColumnType.BOOLEAN, 'Specifications'),
        new TD.Column('regeneration', 'Regeneration', 120, TD.ColumnType.BOOLEAN, 'Specifications')
      ];
      // The link in the first colum will redirect the user to the address
      // in model's property "publisherUrl"
      this._columns[0].referenceField = 'publisherUrl';
      // Sum up third column's values (hero's weight)
      this._columns[2].addSummary(TD.SummaryType.SUM);
    }
    return this._columns;
  }

  // Create Subject and update data on first data inquiery
  private _dataSource: Subject<HeroModel[]> = null;
  get data(): Observable<HeroModel[]> {
    if (this._dataSource === null) {
      this._dataSource = new Subject<HeroModel[]>();
      this.updateData();
    }
    return this._dataSource;
  }

  // Data updating
  private updateData() {
    this.http.get<HeroModel[]>(`https://truedirective.com/api/v1/heroes`).subscribe(data => {
      this._dataSource.next(data);
    });
  }

  private _settings: TD.GridSettings = null;
  get gridSettings() {

    if (this._settings === null) {
      const s = new TD.GridSettings();

      // Minimal height of row will be 30px
      s.rowHeight = 30;

      // Only whole rows can be selected by the user
      s.selectionMode = TD.SelectionMode.ROW;

      // Allow user to edit cell value by clicking on the focused cell
      s.editorShowMode = TD.EditorShowMode.ON_CLICK_FOCUSED;

      // Hide horizontal lines
      s.appearance.horizontalLines = false;

      // Only those cells which are within the limits of the viewport will undergo rendering.
      // During the scrolling new cells will be created and added to DOM.
      // And those cells which are outside the viewport will be removed from DOM and destroyed.
      s.renderMode = TD.RenderMode.VISIBLE;

      this._settings = s;
    }
    return this._settings;
  }

  // Add dependency from HttpClient
  constructor(private http: HttpClient) { }
}
```

As a result we will get a table with 50 rows:

![Result 5](https://truedirective.com/assets/test-grid-6.png)
