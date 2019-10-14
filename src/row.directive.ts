/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Directive, ElementRef, Input, QueryList, EventEmitter, Output,
    Renderer2, Injector,
    OnDestroy, AfterContentInit, DoCheck, OnChanges,
    ComponentFactoryResolver, ApplicationRef,
    SimpleChange } from '@angular/core';

// Base
import { GridLayout } from '@true-directive/base';
import { GridLayoutSelection } from '@true-directive/base';
import { ColumnType, RenderMode } from '@true-directive/base';
import { Column } from '@true-directive/base';
import { CellPosition } from '@true-directive/base';
import { CellHighlighter } from '@true-directive/base';
import { Utils } from '@true-directive/base';
import { Strings } from '@true-directive/base';

// Classes
import { RowCell } from './row-cell.class';

// Services
import { GridStateService } from './grid-state.service';

// Editor components
import { EditorTextComponent } from './editors/editor-text.component';
import { EditorSelectTrueComponent } from './editors/editor-select-true.component';
import { EditorNumberComponent } from './editors/editor-number.component';
import { EditorDateComponent } from './editors/editor-date.component';

// Cell components
import { CellHtmlComponent } from './cells/cell-html.component';
import { CellRefComponent } from './cells/cell-ref.component';

/**
 * Grid row directive. It's all about speed.
 */
@Directive({
  selector: '[true-row]'
})
export class RowDirective implements OnDestroy, AfterContentInit, DoCheck, OnChanges {

    /**
     * Row for rendering
     */
    @Input()
    public row: any;

    /**
     * Grid's state
     */
    @Input('true-state')
    public state: GridStateService;

    /**
     * Index in the list of displayed rows
     */
    @Input('true-i')
    public axI: number;

    /**
     * Layout info
     */
    @Input('true-layout')
    layout: GridLayout;

    /**
     * Indicates we're an empty line and we don't need to do anything.
     */
    @Input('true-empty')
    empty = false;

    /**
     * Horizontal scroll position
     */
    @Input('view-port-left')
    viewPortLeft = -1;

    /**
     * Scrollbox width
     */
    @Input('view-port-width')
    viewPortWidth = -1;

    /**
     * Locale
     */
    @Input('true-locale')
    locale: string = '';

    /**
     * Event - clicking on the checkbox - will cause the value to change
     */
    @Output('toggleCheckbox')
    toggleCheckbox = new EventEmitter<any>();

    /**
     * Data of the displayed row
     */
    protected get rowData(): any {
      return this.state.dataSource.rowData(this.row);
    }

    private _left_rendered = -1;
    private _right_rendered = -1;

    /**
     * Cell list
     */
    private readonly cells: RowCell[] = [];

    /**
     * Cell selection levels
     */
    private selectionMap: number[] = [];

    /**
     * View was initialized
     */
    private _viewInitialized: boolean = false;

    /**
     * One of the cells was in edit mode before destroying the row
     */
    private _wasEditor: CellPosition = null;

    /**
     *  Row height in previous render
     */
    private _height0: number = null;

    /**
     * Locale in previous render
     */
    private _locale0: string = '';

    // Применение стилей помеченных записей
    private _checkedAppearance = false;

    // Подписки на изменения в редакторе
    protected _subscribes: any[] = [];

    /**
     * Предыдущее значение общего текстового фильтра
     */
    private _filter0 = '';

    protected get st() {
      return this.state.settings;
    }

    protected get sta() {
      return this.state.settings.appearance;
    }

    protected get currentRowIndex() {
      return this.axI + this.layout.selection.displayedStartIndex;
    }

    protected get children() {
      return this.elementRef.nativeElement.children;
    }

    protected _editorRef: any = null;
    protected readonly _customCellRefs: any[] = [];
    protected readonly _skips: { element: HTMLElement, fromIndex: number, toIndex: number }[] = [];

    public firstCellRect(): any {
      for (let i = 0; i < this.children.length; i++) {
        const el = this.children[i];
        // Эти вообще не считаем.
        if (el.classList.contains('true-cell-indent')) {
          continue;
        }
        return el.getBoundingClientRect();
      }
      return null;
    }

    private firstCellClientHeight(): number {
      for (let i = 0; i < this.children.length; i++) {
        const el = this.children[i];
        if (el.classList.contains('true-cell-indent')) {
          continue; // Эти могут быть без бордеров, а остальные с бордерами
        }
        return el.clientHeight;
      }
      return null;
    }

    /**
     * Получение поля по координатам
     * @param  x Координата поля
     * @return   [description]
     */
    public cellByXY(x: number, y: number): string {
      let xx = this.cells[0].element.getBoundingClientRect().left;
      for (let i = 0; i < this.cells.length; i++)
      {
          const cell = this.cells[i];
          const col = this.state.columnByFieldName(cell.fieldName);
          const ww = !cell.skipped ? cell.element.offsetWidth : col.displayedWidth;
          if (x >= xx && x < xx + ww) {
            return cell.fieldName;
          }
          xx += ww;
      }
      return '';
    }

    /**
     * Вызывается для получения Х-координаты ячейки с целью прокрутки
     * компонента к заданной ячейке
     * @param  fieldName Наименование поля ячейки
     * @return           Координаты левого и правого края
     */
    public cellHorizontalPos(fieldName: string): { l: number, r: number } {
      const x0 = this.cells[0].element.offsetLeft;
      let xx = x0;
      for (let i = 0; i < this.cells.length; i++)
      {
          const cell = this.cells[i];
          const col = this.state.columnByFieldName(cell.fieldName);
          // Получить clientWidth
          const ww = !cell.skipped ? cell.element.offsetWidth : col.displayedWidth;
          if (cell.fieldName === fieldName) {
            return {
              // Для первой колонки указыаем нулевой offset, чтобы при наличии indents
              // прокрутка осуществлялась к самому началу
              l: i === 0 ? 0 : xx,
              r: xx + ww
            };
          }
          xx += ww;
      }
      return null;
    }

    // Очистка выделения
    public clearSelection() {
      this.cells.forEach((cell)=> {
        cell.setSelected(0);
        cell.setCellFocused(false);
      });
    }

    // Генерируем план выделения
    private getSelectionMap(sel: GridLayoutSelection, rowChecked: boolean = false): any[] {

      const sels: number[] = [];

      let sel0 = 0;

      for (let i = 0; i < this.cells.length; i++) {
        sels.push(sel0);
      }

      for (let j = 0; j < sel.ranges.length; j++) {
        const selection = sel.ranges[j];

        // По вертикали
        let minI = selection.rowIndex;
        let maxI = selection.rowIndex + selection.rangeY;

        // Меняем местами 'to' and 'from'
        if (minI > maxI) {
          const t = maxI;
          maxI = minI; minI = t;
        }

        if (this.currentRowIndex < minI || this.currentRowIndex > maxI) {
          continue; // В этой строке ничего не выделено
        }

        // По горизонтали
        const fromIndex = selection.columnIndex;
        const toIndex = fromIndex + selection.rangeX;
        const selectedColumnIndex = fromIndex;

        for (let i = 0; i < this.cells.length; i++) {
          if (i >= fromIndex && i <= toIndex || i <= fromIndex && i >= toIndex) {
            sels[i]++;
          }
        }
      }
      return sels;
    }

    protected setCellSelection(cell: RowCell, idx: number): number {
      const sel = this.layout.selection;
      const selected = this.selectionMap[idx];
      const cellFocused = this.currentRowIndex === sel.focusedRowIndex && idx === sel.focusedColumnIndex;
      cell.setSelected(selected);
      cell.setCellFocused(cellFocused);
      return selected;
    }

    // Устанавливаем выделение
    public setSelection() {

      const sel = this.layout.selection;
      const rowChecked = this.state.isRowChecked(this.row);

      if (this.state.sta.checkedRowClass != '' && (this.state.sta.enableCheckedAppearance || this._checkedAppearance)) {
        if (rowChecked && this.state.sta.enableCheckedAppearance) {
          this.elementRef.nativeElement.classList.add(this.sta.checkedRowClass);
        } else {
          this.elementRef.nativeElement.classList.remove(this.sta.checkedRowClass);
        }
      }

      this._checkedAppearance = this.sta.enableCheckedAppearance;

      if (sel.ranges.length < 1 && !rowChecked) {
        this.clearSelection();
        return;
      }

      this.selectionMap = this.getSelectionMap(sel, rowChecked);
      this.cells.forEach((cell, i) => {
        this.setCellSelection(cell, i);
      });
    }

    // Полная очистка строки
    protected clear(saveH: boolean = false) {

      if (saveH) {
        // Сохраняем высоту строки для редактора
        this._height0 = this.firstCellClientHeight();
      } else {
        // Сбрасываем высоту строки, чтобы не было недостоверной информации
        this._height0 = null;
      }

      this._subscribes.forEach(s => s.unsubscribe());
      this._subscribes = [];

      this.cells.splice(0, this.cells.length);

      let itemsToRemove = [];
      let i = 0;
      while (i < this.children.length) {
      //  this.children[i].style.display = 'none';
        //itemsToRemove.push(this.children[i]);
        i++;
      }
      // itemsToRemove.forEach(item => this._renderer.removeChild(this.elementRef.nativeElement, item));
      this.elementRef.nativeElement.innerHTML = '';

      if (this._customCellRefs.length > 0) {
        this._customCellRefs.forEach(r => r.destroy());
        this._customCellRefs.splice(0, this._customCellRefs.length);
      }

      this.clearEditor();
    }

    protected clearEditor() {
      this._height0 = this.firstCellClientHeight();
      if (this._editorRef && this._wasEditor) {
        const cp = this._wasEditor;
        this.cells.forEach(cell => {
          if (cell.fieldName === cp.fieldName && this.rowData === cp.row) {

            this._renderer.removeClass(cell.element, 'true-cell-input');
            let itemsToRemove = [];
            let i = 0;
            while (i < cell.element.children.length) {
              itemsToRemove.push(cell.element.children[i]);
              i++;
            }
            itemsToRemove.forEach(item => this._renderer.removeChild(cell.element, item));

            const col = this.state.columnByFieldName(cp.fieldName);
            const rowData = this.rowData;
            const v = this.rowData[col.fieldName];
            const v_displayed = this.getDisplayedValue(col, rowData, v);
            this.fillCell(cell, col, rowData, false, v, v_displayed);
            cell.value = v;
          }
          /*
              this._editorRef.destroy();
              this._editorRef = null;
          */

          this._wasEditor = null;
        });
      }
    }

    // Чекбокс создается прямо в td. Для того, чтобы его ширина не зависела
    // от наличия бордеров и ширины ячейки, было бы неплохо создать
    // промежуточный div с display: flex. Но вызов еще одного createElement
    // сильно замедляет процесс создания строки.
    protected renderBoolean(rowData: any, cell: RowCell, col: Column, v: any) {
      const divEl = this._renderer.createElement('div');
      if (this.st.canEditColumnCell(col)) {
        this._renderer.addClass(divEl, this.sta.checkboxClass);
        this._renderer.listen(divEl, 'mousedown', (e: any) => e.stopPropagation());
        this._renderer.listen(divEl, 'dblclick', (e: any) => e.stopPropagation());
        this._renderer.listen(divEl, 'click', (e: any) => {
          this.toggleCheckbox.emit({row: rowData, fieldName: col.fieldName});
          e.stopPropagation();
        });
        this._renderer.appendChild(cell.element, divEl);
      } else {
        const classes = this.sta.booleanClass.trim().split(' ');
        classes.forEach(s => this._renderer.addClass(divEl, s));

        this._renderer.appendChild(cell.element, divEl);
      }
      cell.cbElement = divEl;
      cell.setChecked(v);
    }

    protected renderCheckbox(cell: RowCell, col: Column, v: any) {
      const divEl = this._renderer.createElement('div');

      this._renderer.addClass(divEl, this.sta.checkboxClass);
      if (!this.st.checkByCellClick) {
        this._renderer.listen(divEl, 'mousedown', (e: any) => e.stopPropagation());
        this._renderer.listen(divEl, 'dblclick', (e: any) => e.stopPropagation());
        this._renderer.listen(divEl, 'click', (e: any) => {
          this.toggleCheckbox.emit({ row: this.row, fieldName: col.fieldName });
          e.stopPropagation();
        });
      }
      cell.cbElement = divEl;
      this._renderer.appendChild(cell.element, divEl);
      cell.setChecked(v);
    }

    protected renderEditor(rowData: any, cell: RowCell, col: Column, v: any) {
      this._renderer.addClass(cell.element, 'true-cell-input');

      let editorType: any = EditorTextComponent;

      if (col.type === ColumnType.DATETIME) {
        editorType = EditorDateComponent;
      }

      if (col.type === ColumnType.NUMBER) {
        editorType = EditorNumberComponent;
      }

      if (col.type === ColumnType.UNSAFE_HTML) {
        editorType = EditorSelectTrueComponent;
      }

      if (col.editorComponentType !== null) {
        editorType = col.editorComponentType;
      }

      const componentFactory = this._cfResolver.resolveComponentFactory(editorType);
      this._editorRef = componentFactory.create(this._injector, [], cell.element);

      this._appRef.attachView(this._editorRef.hostView);

      // Initialization
      this._editorRef.instance.state = this.state;
      this._editorRef.instance.column = col;
      this._editorRef.instance.row = rowData;

      // Тест, когда всё редакторы
      if (this._height0 === null && this.state.editorHeight !== null) {
        // Если в состоянии сохранена высота, то используем её
        this._height0 = this.state.editorHeight;
      } else {
        // Иначе наоборот - сохраняем высоту
        this.state.editorHeight = this._height0;
      }

      // Один пиксел добавим
      let dh = 0;
      if (this.axI !== 0 && !this.state.IE && this.sta.horizontalLines) {
        dh = 1;
      }

      // Изменение значения. Сохраняем измененное.
      const s_change = this._editorRef.instance.change.subscribe((v: any) => {
        this.state.editorValue = v;
      });

      // Подтверждение редактирования. Отправляем в данные
      const s_commit = this._editorRef.instance.commit.subscribe((e: any) => {
        this.state.commitEditor(this.row, col.fieldName, e);
      });

      // Отмена редактирования
      const s_cancel = this._editorRef.instance.cancel.subscribe(() => {
        let cp: CellPosition = this._wasEditor.clone();
        this.state.stopEditing(cp, true, true);
      });

      this._editorRef.instance.init(this.state.editorValue,
                                    this.state.editorValueChanged,
                                    this._height0 + dh,
                                    this.state.IE,
                                    this.state.editorWasShown);

      this.state.editorWasShown = true;
      // Persisting last editor state
      if (this.state.editor) {
        this._wasEditor = this.state.editor.clone();
      }

      //
      this._subscribes.push(s_change);
      this._subscribes.push(s_commit);
      this._subscribes.push(s_cancel);
    }

    // Пока так
    private renderCustomCell(rowData: any, cell: RowCell, col: Column, v: any, componentType: any = CellHtmlComponent) {
      this._renderer.addClass(cell.element, 'true-cell-custom');

      const componentFactory = this._cfResolver.resolveComponentFactory(componentType);
      const cr: any = componentFactory.create(this._injector, [], cell.element);

      // Initialization
      cr.instance.state = this.state;
      cr.instance.column = col;
      cr.instance.row = rowData;

      this._appRef.attachView(cr.hostView);

      cr.instance.init(this.getDisplayedValue(col, rowData, v));

      // Подтверждение редактирования. Отправляем в данные
      const s = cr.instance.event.subscribe((e: any)=> {
        // вызываем в стэйте
      });

      this._customCellRefs.push(cr);
      this._subscribes.push(s);
    }

    protected getDisplayedValue(col: Column, rowData: any, v: any) {
       return this.state.dataSource.displayedValue(col, v, rowData);
    }

    protected fillCell(cell: RowCell, col: Column, rowData: any, isFirst: boolean, v: any, v_displayed: any): RowCell {

      const classes = this.state.st.cellClass(col).trim().split(' ');
      classes.forEach(s => {
        if (s !== '') {
          this._renderer.addClass(cell.element, s);
        }
      });

      cell.rendered = true;
      cell.fieldName = col.fieldName;
      // cell.value = v;

      const tdEl = cell.element;

      if (col.isCheckbox) {
        // Помечаются не только данные, но и заголовки групп. Поэтому
        // апдейтится строка из результирующего набора данных
        this.renderCheckbox(cell, col, v);
        return cell;
      }

      if (col.isBoolean) {
        // Может быть изменено только значение исходных данных, но не
        // заголовков групп. Поэтому отправляется исходная строка
        this.renderBoolean(rowData, cell, col, v);
        return cell;
      }

      if (col.type === ColumnType.REFERENCE) {
        this.renderCustomCell(rowData, cell, col, v, CellRefComponent);
        return cell;
      }

      if (this.state.editor !== null &&
          this.state.editor.fieldName === col.fieldName &&
          this.state.editor.row === rowData) {
        // Заголовок группы не может быть отредактирован, отправляются исходные
        // данные
        this.renderEditor(rowData, cell, col, v);
        return cell;
      }

      if (col.cellComponentType !== null) {
        // Чтобы кастомная ячейка не путалась, отправляются исходные данные.
        // Если ячейка будет создана в заголовке группы - мы это не предусмотрели.
        this.renderCustomCell(rowData, cell, col, v, col.cellComponentType);
        return cell;
      }

      if (col.type === ColumnType.HTML) {
        // Чтобы кастомная ячейка не путалась, отправляются исходные данные.
        // Если ячейка будет создана в заголовке группы - мы это не предусмотрели.
        this.renderCustomCell(rowData, cell, col, v);
        return cell;
      }

      let html: boolean = col.type === ColumnType.UNSAFE_HTML;
      if (this.state.dataSource.searchString !== '' && this.state.st.searchHighlight) {
        html = true;
      }

      if (html) {
        const s = this.state.dataSource.searchString;
        tdEl.innerHTML = CellHighlighter.highlight(s, col, v, v_displayed);
      } else {
        tdEl.innerText = v_displayed;
      }

      return cell;
    }

    private needRender(col: Column, xPos: number, isFirst: boolean) {
      let render = true;
      // Не все ячейки рендерятся только при настройке RenderMode.VISIBLE
      if (this.st.renderMode !== RenderMode.VISIBLE) {
        return render;
      }

      if (this.viewPortLeft >= 0 && !isFirst) {
        // Учитываем вьюпорт
        if (xPos > (this.viewPortLeft + this.viewPortWidth)) {
          // Мы находимся правее
          render = false;
        }
        if ((xPos + col.headerWidth) < this.viewPortLeft) {
          // Мы находимся левее
          render = false;
        }
      }
      return render;
    }

    protected createTd(span: number): HTMLElement {
      const tdEl = this._renderer.createElement('td');

      if (span > 1) {
        this._renderer.setAttribute(tdEl, 'colspan', span + '');
      }

      return tdEl;
    }

    /**
     * Создание ячейки
     * @param  col   Колонка
     * @param  span  Количество объединенных ячеек
     * @return       Объект RowCell
     */
    protected createCell(col: Column, span: number = 1, isFirst: boolean = false, xPos: number = -1, render: boolean = true): RowCell {

      const rowData = this.rowData;
      const v = rowData[col.fieldName];
      const cell = new RowCell(col.fieldName, v, null);

      cell.element = this.createTd(span);

      if (render) {
        const v_displayed = this.getDisplayedValue(col, rowData, v);
        this.fillCell(cell, col, rowData, isFirst, v, v_displayed);
      }

      return cell;
    }

    // Для дерева - проверка необходимости объединения ячеек
    protected needApplySpan(): number {
      return 1;
    }

    private createSkipCell(skipCount: number): HTMLElement {
      const tdEl = this._renderer.createElement('td');
      this._renderer.setAttribute(tdEl, 'colspan', skipCount + '');
      return tdEl;
    }

    protected renderRowEditor() {
      for (let i = 0; i < this.layout.columns.length; i++) {
        const col: Column = this.layout.columns[i];
        const cell = this.cells[i];

        if (this.state.editor !== null &&
            this.state.editor.fieldName === col.fieldName &&
            this.state.editor.row === this.rowData) {
          // Заголовок группы не может быть отредактирован, отправляются исходные
          // данные
          const v = this.rowData[col.fieldName];
          this.renderEditor(this.rowData, cell, col, v);
          return cell;
        }
      }
    }

    // Заполнение строки (создание разметки и вставка данных)
    protected renderRow() {
      this._locale0 = this.locale;
      this._skips.splice(0, this._skips.length);
      this._wasEditor = null;

      if (!this.empty) {
        this._filter0 = this.state.dataSource.searchString;
      }

      // Удаление старых ячеек
      this.cells.splice(0, this.cells.length);
      let firstCell = true;

      if (this.empty) {
        const tdEl = this._renderer.createElement('td');
        this._renderer.setAttribute(tdEl, 'colspan', this.layout.columns.length + '');
        this._renderer.appendChild(this.elementRef.nativeElement, tdEl);
        return;
      }
      // const dt = Date.now();
      let xPos = 0;
      let skipCount = 0;
      let skipStart = -1;
      let skipEnd = -1;

      for (let i = 0; i < this.layout.columns.length; i++) {
        const col: Column = this.layout.columns[i];
        // Для дерева.. Нам нужен уровень.. И растягивание первой не чекбоксовой колонки
        // Но только если мы находимся в самой левой части
        let span = 1;
        const f = firstCell;
        if (firstCell && !col.isCheckbox) {
          span = this.needApplySpan();
          firstCell = false;
        }
        // Done
        const needRender = this.needRender(col, xPos, f);
        const cell = this.createCell(col, span, f, xPos, needRender);
        this.cells.push(cell);

        if (needRender) {
          if (skipCount > 0) {
            // Was skips
            const skipTd = this.createSkipCell(skipCount);
            this._renderer.appendChild(this.elementRef.nativeElement, skipTd);
            skipCount = 0;
            this._skips.push({ element: skipTd, fromIndex: skipStart, toIndex: skipEnd });
          }
          // Very resource intensive operation
          this._renderer.appendChild(this.elementRef.nativeElement, cell.element);
        } else {
          if (skipCount === 0) {
            skipStart = i;
          }
          skipEnd = i;
          cell.skipped = true;
          skipCount++;
        }
        xPos += col.headerWidth;
      }

      if (skipCount > 0) {
        const skipTd = this.createSkipCell(skipCount);
        this._renderer.appendChild(this.elementRef.nativeElement, skipTd);
        this._skips.push({ element: skipTd, fromIndex: skipStart, toIndex: skipEnd });
      }

      this.setSelection();
      this.setDisabledFields();

      this._left_rendered = this.viewPortLeft;
      this._right_rendered = this.viewPortLeft + this.viewPortWidth;
    }

    private nextEl(el: HTMLElement): HTMLElement {
      let found = false;
      for (let i = 0; i < this.children.length; i++) {
        if (this.children[i] === el) {
          found = true;
          continue;
        }
        if (found) {
          return this.children[i];
        }
      }
      return null;
    }

    protected unskip(cell: RowCell, i: number) {

      for(let j = 0; j < this._skips.length; j++) {

        const skip = this._skips[j];

        if (i >= skip.fromIndex && i <= skip.toIndex) {
          let insertBeforeEl: HTMLElement = null;
          if (i === skip.fromIndex) {
            // Добавляем слева
            skip.fromIndex++;
            this._renderer.insertBefore(this.elementRef.nativeElement, cell.element, skip.element);
          } else {
            if (i === skip.toIndex) {
              // Добавляем справа
              skip.toIndex--;
              const nextEl = this.nextEl(skip.element)
              if (nextEl !== null) {
                this._renderer.insertBefore(this.elementRef.nativeElement, cell.element, nextEl);
              } else {
                this._renderer.appendChild(this.elementRef.nativeElement, cell.element);
              }
            } else {
              // Добавляем посередине
              // Создаем новый скип...
              let newEl = this.createSkipCell(i - skip.fromIndex);
              this._renderer.insertBefore(this.elementRef.nativeElement, cell.element, skip.element);
              this._renderer.insertBefore(this.elementRef.nativeElement, newEl, cell.element);
              this._skips.push({ element: newEl, fromIndex: skip.fromIndex, toIndex: i-1 });
              skip.fromIndex = i + 1;
            }
          }

          if (skip.fromIndex > skip.toIndex) {
            // Удаляем этот пропуск
            this._skips.splice(j, 1);
            this._renderer.removeChild(this.elementRef.nativeElement, skip.element);
          } else {
            // Меняем его спан
            this._renderer.setAttribute(skip.element, 'colspan', (skip.toIndex - skip.fromIndex + 1) + '');
          }
          cell.skipped = false;
          break;
        }
      }
    }

    protected renderByViewPort() {

      const rowData = this.rowData;
      const right = this.viewPortLeft + this.viewPortWidth;
      const left = this.viewPortLeft;

      let xPos = 0;
      // Первая ячейка всегда отрендерена
      for (let i = 0; i < this.layout.columns.length; i++) {

        // Подготавливаем данные
        const col: Column = this.layout.columns[i];
        const cell = this.cells[i];

        if (!cell) {
          continue;
        }

        // Решаем, рендерить или нет
        let needRender = this.needRender(col, xPos, false);

        // Нужно последовательно добавлять...
        if (needRender && i > 0) {
          if (!cell.rendered) {
            const v = cell.value;
            const v_displayed = this.getDisplayedValue(col, rowData, v);
            this.fillCell(cell, col, rowData, i === 0, v, v_displayed);
          }

          if (cell.skipped) {
            this.unskip(cell, i);
          }
        }
        xPos += col.headerWidth;
      }

      if (this._right_rendered < (this.viewPortLeft + this.viewPortWidth)) {
        this._right_rendered = this.viewPortLeft + this.viewPortWidth;
      }

      if (this._left_rendered > this.viewPortLeft) {
        this._left_rendered = this.viewPortLeft;
      }
    }

    // Проверяем, нужно ли пересоздать по причине включения или выключения редактора
    private checkEditor(): boolean {

      if (this._wasEditor === null && this.state.editor === null) {
        // Всё ок.
        // Редактора и не было и не намечается.
        return true;
      }

      if (this._wasEditor === null && this.state.editor !== null) {
        // Не было, но появился
        if (this.state.editor.row !== this.rowData) {
          // Но строка не наша
          return true;
        }
      }

      if (this._wasEditor !== null && this.state.editor !== null) {
        // Был и не стало
        if (this._wasEditor.row === this.state.editor.row) {
          // В этой строке
          if (this._wasEditor.fieldName === this.state.editor.fieldName) {
            return true; // Не изменилось, оставляем
          }
        }
      }
      return false;
    }

    /**
     * We check whether it is necessary to recreate the string when changing the
     * column. If there were simple changes (two columns swapped or one of them
     * just disappeared), we try to apply these changes without a full rerendering.
     * @return True if we don't need a rerender.
     */
    protected checkColumns(): boolean {

      if (!this.layout) {
        return false;
      }

      if (this.cells.length === 0 && !this.layout.columns) {
        return true;
      }

      // The current number of cells is more than 1 higher than the number
      // of columns.
      if (this.cells.length > (this.layout.columns.length + 1)) {
        return false;
      }

      if (this.cells.length < (this.layout.columns.length - 1)) {
        return false;
      }

      let i = 0;
      let changed = false;

      while (i < this.cells.length) {

        if (!this.layout || !this.layout.columns[i]) {
          return false;
        }

        if (this.state.isTree && this.layout.columns[i].fieldName !== this.cells[i].fieldName) {
          // For a tree, it wouldn't help if we just moved the columns around.
          return false;
        }

        if (this.layout.columns[i].fieldName !== this.cells[i].fieldName) {
          // Let's consider three scenarios so that we don't recreate the entire line...
          if (i < this.cells.length - 1 &&
              this.layout.columns[i].fieldName === this.cells[i + 1].fieldName) {
            // 1. The column is missing?
            // Removing the cell.
            const ww = this.cells[i].element.offsetWidth;
            this._renderer.removeChild(this.elementRef.nativeElement, this.cells[i].element);
            this.cells.splice(i, 1);
            this._skips.forEach(s => {
              if (s.toIndex > i) {
                s.toIndex--;
              }
              if (s.fromIndex > i) {
                s.fromIndex--;
              }
            });
            continue;
          } else {
            if (i < this.cells.length - 2 &&
                this.layout.columns[i].fieldName === this.cells[i + 2].fieldName) {
              // 1.1. Two columns are missing?
              // Remove one cell. The second one will be removed by the next iteration.
              this._renderer.removeChild(this.elementRef.nativeElement, this.cells[i].element);
              this.cells.splice(i, 1);
              this._skips.forEach(s => {
                if (s.toIndex > i) {
                  s.toIndex--;
                }
                if (s.fromIndex > i) {
                  s.fromIndex--;
                }
              });
              continue;
            } else {
              if (i < this.layout.columns.length - 1 &&
                  this.cells[i].fieldName === this.layout.columns[i + 1].fieldName) {
                // 2. New column?
                if (this.cells[i].skipped) {
                  return false;
                }
                this.viewPortLeft = -1;
                const cell = this.createCell(this.layout.columns[i]);
                cell.setDisabled(this.state.disabledFields.indexOf(cell.fieldName) >= 0);
                this._renderer.insertBefore(this.elementRef.nativeElement, cell.element, this.cells[i].element);
                this.cells.splice(i, 0, cell);
                this._skips.forEach(s => {
                  if (s.toIndex > i) {
                    s.toIndex++;
                  }
                  if (s.fromIndex > i) {
                    s.fromIndex++;
                  }
                });
                changed = true;
                i++;
              } else {
                // Didn't help, we need to rerender!
                return false;
              }
            }
          }
        }
        i++;
      }

      // Render what fit on the screen after changing the columns.
      this.renderByViewPort();
      if (changed) {
        this.setSelection();
      }

      return true;
    }

    protected checkValues(): boolean {

      if (!this.layout) {
        return false;
      }

      if (this.cells.length === 0 && !this.layout.columns) {
        return true;
      }

      // Другое количество ячеек
      if (this.cells.length !== this.layout.columns.length) {
        return false;
      }

      // Нужно обновить подсветку
      if (this._filter0 !== this.state.dataSource.searchString) {
        return false;
      }

      let i = 0;
      while (i < this.cells.length) {
        const cell = this.cells[i];
        const rowData = this.rowData;
        if (rowData[cell.fieldName] !== cell.value) {

          if (cell.cbElement) {
            cell.setChecked(this.row[cell.fieldName]);
          } else {
            // Даём шанс редактору не инициировать перерисовку всей строки
            if (this._wasEditor &&
                this._wasEditor.fieldName === cell.fieldName &&
                this._wasEditor.row === this.rowData) {
              i++;
              continue;
            }
            return false;
          }
        }
        i++;
      }
      return true;
    }

    setDisabledFields() {
      this.cells.forEach(cell => {
        cell.setDisabled(
          this.state.disabledFields.indexOf(cell.fieldName) >= 0);
      });
    }

    protected setParams(byInit: boolean = false) {
      if (byInit) {
        this.renderRow();
        this._viewInitialized = true;
        return;
      }
      if (!this._viewInitialized) {
        return;
      }
    }

    protected checkViewPort(): boolean {
      return this._left_rendered <= this.viewPortLeft
         && this._right_rendered >= (this.viewPortLeft + this.viewPortWidth);
    }

    protected check(): boolean {

      const localeChanged: boolean = this.locale !== this._locale0;
      let settingsChanged = false;

      if (this._checkedAppearance !== this.sta.enableCheckedAppearance) {
        settingsChanged = true;
      }

      let valuesChanged = false;
      //let editorChanged = false;

      const columnsChanged = !this.checkColumns();
      if (!columnsChanged) {
        valuesChanged = !this.checkValues();
        //if (!valuesChanged) {
          //editorChanged = !this.checkEditor();
        //}
      }
      return !(columnsChanged || valuesChanged || //editorChanged ||
        settingsChanged || localeChanged);
    }

    ngOnChanges(changes: {[property: string]: SimpleChange }) {
      this.setParams();
    }

    ngDoCheck() {

      if (!this._viewInitialized) {
        return;
      }

      if (!this.check()) {
        // Изменились основные параметры строки (колонки, значения, редактор)
        const hasEditor = this.state.editor && this.state.editor.row === this.rowData;
        // Очищаем
        this.clear(hasEditor);
        // И заново формируем строку
        this.renderRow();
        return;
      }

      //
      if (!this.checkEditor()) {
        this.clearEditor();
        this.renderRowEditor();
      }

      // Изменились параметры отображения
      if (!this.checkViewPort()) {
        // Формируем только те ячейки, которые добавлены к уже отрендеренным
        this.renderByViewPort();
      }

      this.setSelection();
      this.setDisabledFields();
    }

    ngAfterContentInit() {
      this.setParams(true);
    }

    ngOnDestroy() {
      this.clear();
    }

    constructor(
      protected _renderer: Renderer2,
      protected _cfResolver: ComponentFactoryResolver,
      protected _appRef: ApplicationRef,
      protected _injector: Injector,
      public elementRef: ElementRef) { }
}
