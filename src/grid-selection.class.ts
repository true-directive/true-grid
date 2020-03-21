/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';

import { Selection } from '@true-directive/base';
import { CellPosition } from '@true-directive/base';

export class GridSelection extends Selection {
  // Изменен фокус
  protected _onFocusChanged: Subject<CellPosition> = new Subject();
  public readonly onFocusChanged: Observable<CellPosition> = this._onFocusChanged.asObservable();

  // Изменено выделение. Аргумент - последняя позиция последнего range
  protected _onSelectionChanged: Subject<CellPosition> = new Subject();
  public readonly onSelectionChanged: Observable<CellPosition> = this._onSelectionChanged.asObservable();

  protected selectionChangedEvent(cp: CellPosition) {
    this._onSelectionChanged.next(cp);
  }

  protected focusChangedEvent(cp: CellPosition) {
    this._onFocusChanged.next(cp);
  }

  constructor() {
    super();
  }
}
