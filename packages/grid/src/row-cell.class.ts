/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/**
 * Cell data
 */
export class RowCell {

  private _disabled: boolean = false;
  private _selected: number = 0;
  private _cellSelected: boolean = false;
  private readonly _disClass = 'true-cell-disabled';
  private readonly _cfClass = 'true-cell-focused';
  private readonly _rsClass = 'true-range-selected';
  private readonly _maxLevel = 5;

  public cbElement: HTMLElement;
  public rendered = false;
  public added = false;
  public skipped = false;

  private toggleClass(cls: string, v: boolean): boolean {
    if (v) {
      this.element.classList.add(cls);
    } else {
      this.element.classList.remove(cls);
    }
    return v;
  }

  public setDisabled(v: boolean) {
    if (this._disabled === v) {
      return;
    }
    this._disabled = this.toggleClass(this._disClass, v);
  }

  public setCellFocused(v: boolean) {
    if (this._cellSelected === v) {
      return;
    }
    this._cellSelected = this.toggleClass(this._cfClass, v);
  }

  public setSelected(v: number) {

    if (this._selected === v) {
      return;
    }

    if (v > this._maxLevel) {
      // Более 5 раз одну и ту же ячейку выбрать можно.
      v = this._maxLevel;  // Но дальше пятого уровня различию по рендерингу у них нет.
    }

    if (this._selected > 0) {
      this.element.classList.remove(this._rsClass);
      this.element.classList.remove(this._rsClass + this._selected);
    }

    if (v > 0) {
      this.element.classList.add(this._rsClass);
      this.element.classList.add(this._rsClass + v);
    }

    this._selected = v;
  }

  // Установка классов чекбокса
  public setChecked(v: boolean) {
    if (!this.cbElement) {
      return;
    }

    this.value = v;
    if (v) {
      this.cbElement.classList.remove('indeterminate');
      this.cbElement.classList.add('checked');
    } else {
      if (v === null || v === undefined) {
        this.cbElement.classList.remove('checked');
        this.cbElement.classList.add('indeterminate');
      } else {
        this.cbElement.classList.remove('checked');
        this.cbElement.classList.remove('indeterminate');
      }
    }
  }

  constructor(
    public fieldName:string,
    public value: any,
    public element: HTMLElement
  ) { }
}
