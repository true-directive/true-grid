/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { RenderMode, DetectionMode, SelectionMode, EditorShowMode,
         ColumnType } from './enums';

import { Column } from './column.class';
import { GridAppearance } from './grid-appearance.class';

/**
 * Настройки грида.
 */
export class GridSettings {

  /**
   * Field's name which allows to identify the specific object.
   * You should set this property to avoid loosing grid's selected ranges
   * after updating the data.
   */
  public keyField = '';

  /**
   * Change detection mode
   */
  public readonly appearance: GridAppearance = new GridAppearance();

  /**
   * Грид запрашивает данные у родительского компонента
   * (у обработчика события state.OnDataQuery)
   */
  public requestData = false;

  /**
   * Единица измерения ширины колонок
   */
  public widthUnit = 'px';

  /**
   * Режим проверки изменений. При значении MANUAL необходимо вручную вызывать
   * обновление грида после изменения данных.
   */
  public changeDetectionMode: DetectionMode = DetectionMode.MANUAL;

  /**
   * Режим отрисовки (все данные или только видимые)
   */
  public renderMode: RenderMode = RenderMode.ALL;

  /**
   * Способ выделения ячеек данных
   */
  public selectionMode: SelectionMode = SelectionMode.ROW_AND_RANGE;

  /**
   * Выделение нескольких ячеек/строк/областей (с удержанием Ctrl key)
   */
  public multiSelect = false;

  /**
   * Перенос строки в заголовках
   */
  public headerWordWrap = false;

  /**
   * Перенос строки в данных
   */
  public dataWordWrap = false;

  /**
   * Высота строки в пикселах. Можно задать заведомо меньшую высоту, тогда
   * высота строки будет такой, чтобы уместить контент. Если высота задана,
   * то минимальная высота будет такой.
   */
  public rowHeight = 25;

  /**
   * Высота строки для грида, который находится в окне фильтров.
   * Если не задан, берется rowHeight
   */
  private _filterItemRowHeight: number = null;
  public get filterItemRowHeight() {
    if (this._filterItemRowHeight === null) {
      return this.rowHeight;
    }
    return this._filterItemRowHeight;
  }

  public set filterItemRowHeight(v: number) {
    this._filterItemRowHeight = v;
  }

  /**
   * Максимальная высота выпадающего списка для редактора EditorSelectTrue.
   * Нужно указать с единицей измерения.
   */
  public maxDropDownHeight = '350px';

  /**
   * Внутренний или пользовательский шаблон
   */
  public customTemplate = false;

  // Настройки
  public columnResize = true;
  public columnReorder = true;
  public bandReorder = true;

  public allowSorting = true;
  public allowFilter = true;
  public allowFixedColumns = true;

  public rowDrag = false;

  /**
   * При обнаружении iOS или Android горизонтальный и вертикальный скролл производится
   * двумя разными скроллбоксами. Для избежания дерганий.
   * Но если скролл по горизонтали не предусмотрен, то лучше отключить эту опцию.
   */
  public enableTouchScroll = true;

  // Еще настройки
  public showGroupArea = true;
  public showHeader = true;
  public showBands = true;
  public showFooter = true;

  /**
   * Значение чекбокса меняется по клику всей ячейки
   */
  public checkByCellClick = false;

  /**
   * Показывать счетчик количества rows в группе
   */
  public showGroupCounts = false;

  /**
   * Группы сколлапсированы по умолчанию
   */
  public groupCollapseByDefault = false;

  /**
   * Минимальная ширина колонки, доступная при изменении ширины пользователем
   * В указанных выше единицах измерения
   */
  public minColumnWidthOnResize = 100;

  /**
   * Автоматическое растягивание колонок
   */
  public columnAutoWidth = false;

  /**
   * Ширина отступа при формировании уровней группировки или при отображении
   * дочерних items дерева
   */
  public levelIndent = 36;

  /**
   * Свойство, в которых содержится список дочерних items.
   * Если задано, то считается, что грид отображает дерево.
   */
  public treeChildrenProperty = '';

  // Иконка переключателя групп
  public groupSwitcherIconField = '';

  // Параметры автоматической прокрутки при drag-n-drop
  /**
   * Шаг автоматической прокрутки при drag-n-drop в пикселах
   */
  public autoScrollStep = 30;

  /**
   * Интервал автоматической прокрутки при drag-n-drop в миллисекундах
   */
  public autoScrollInterval = 50;

  /**
   * Способ перехода ячейки в режим редактирования. По умолчанию возможность
   * редактирования отключена
   */
  public editorShowMode: EditorShowMode = EditorShowMode.NONE;

  /**
   * Активация редактора при нажатии клавиши (не учитываются стрелочные клавиши и RETURN)
   */
  public editorByKey = true;

  /**
   * Автоматическое принятие изменений, сделанных в редакторе.
   * Если true, то изменения принимаются при потере фокуса, при переходе
   * на другую ячейку.
   * Если false, то изменения принимаются только при нажатии Enter, а в
   * остальных случаях отменяются.
   */
  public editorAutoCommit = true;

  /**
   * Подсветка найденной подстроки общего текстового фильтра. Для подсветки
   * используется свойство innerHTML ячейки. При наличии колонок с типом HTML
   * могут быть сложности.
   */
  public searchHighlight = true;


  /**
   * Number of milliseconds between user input of search string and data
   * processing. If value set is too low, refresh will occur too often, which
   * will lead to subjectively worse perceptual performance.
   */
  public searchDelay = 350;

  /**
   * Is row's height fixed?
   */
  public get fixedRowHeight() {
    return !this.dataWordWrap;
  }

  /**
   * Minimal settings for dropdown lists
   */
  public static minimal(autoWidth: boolean = false): GridSettings {
    const s = new GridSettings();

    s.changeDetectionMode = DetectionMode.MANUAL;

    s.showGroupArea = false;   // No grouping
    s.showBands = false;       // No column bands
    s.showFooter = false;      // No footer
    s.dataWordWrap = false;
    s.allowSorting = false;    // No sort

    s.allowFilter = false;     // No filters
    s.columnResize = false;    // No column resizing
    s.columnReorder = false;   // No column reordering

    // Select only single rows
    s.selectionMode = SelectionMode.ROW;
    s.multiSelect = false;

    // No lines
    s.appearance.verticalLines = false;
    s.appearance.horizontalLines = false;
    s.appearance.headerVerticalLines = false;

    // Simple group styles
    s.appearance.groupL1Class = 'true-group-simple';
    s.appearance.groupClass = 'true-group-simple';

    // No highlights
    s.appearance.enableFocusedAppearance = false;
    // No checked rows
    s.appearance.enableCheckedAppearance = false;
    // Hovered row
    s.appearance.enableHoverAppearance = true;

    // Не показываем количество строк в группе
    s.showGroupCounts = false;

    // Подгоняем ширину колонок под размер окна
    s.columnAutoWidth = autoWidth;

    return s;
  }

  /**
   * Можно ли выделять прямоугольные области при заданных настройках
   */
  public canSelectRange(): boolean {
    return this.selectionMode.range;
  }

  /**
   * Ширина правой пустой колонки в заголовке
   * @return Ширина с единицей измерения
   */
  public get hdWidth(): string {
    let dw = '96px';
    if (this.widthUnit !== 'px') {
      dw = 8 + this.widthUnit;
    }
    return dw;
  }

  /**
   * Класс ячейки данных
   * @return Список классов через пробел
   */
  public cellClass(col: Column): string {

    let res = '';

    if (col.isNumeric) {
      // Числа выровниваются по правому краю
      res = 'true-align-right';
    } else {
      if (col.isCheckbox) {
        // Чекбоксы выравниваются по центру
        res = 'true-align-center true-cell-checkbox';
        if (this.checkByCellClick) {
          res += ' true-check-by-click';
        }
      } else {
        if (col.isBoolean) {
          // Булеваые значения по центру
          res = 'true-align-center true-cell-boolean';
        }
      }
    }

    // Дополнительный класс из свойств колонки
    if (col.class) {
      res += ' ' + col.class;
    }
    return res;
  }

  /**
   * Класс ячейки заголовка
   */
  public headerCellClass(col: Column): string {
    let res = '';
    if (col.type === ColumnType.CHECKBOX) {
      res += ' true-header-cell__checkbox';
    } else { // не разрешим менять ширину колонки с чекбоксом
      if (this.columnResize) {
        if (col.columnResize === null || col.columnResize) {
          res += ' true-column-resizable';
        }
      }
      if (!this.allowFilter || !col.allowFilter) {
        res += ' true-column-nobtn';
      }
    }

    return res;
  }

  /**
   * Класс ячейки футера
   */
  public footerCellClass(col: Column): string {
    if (col.type === ColumnType.CHECKBOX) {
      return 'true-footer-cell__is-checkbox';
    }
    return '';
  }

  /**
   * Класс ячейки данных с чекбоксом
   * @param  v Значение
   */
  public checkboxClass(v?: boolean): string {
    let res = this.appearance.checkboxClass;
    if (v === null) {
      res += ' indeterminate';
    } else {
      res = v ? ' checked' : '';
    }
    return res;
  }

  /**
   * Класс ячейки заголовка с чекбоксом
   * @param  v Значение (отмечено / не отмечено)
   * @return Класс
   */
  public headerCheckboxClass(v?: boolean): string {
    let res = this.appearance.checkboxClass;
    if (v === null) {
      res += ' indeterminate';
    } else {
      res += v ? ' checked' : '';
    }
    return res;
  }

  /**
   * Ширина отступа одного уровня
   * @return Ширина с единицей измерения
   */
  get levelWidth() {
    return this.levelIndent + this.widthUnit;
  }

  /**
   * Проверка возможности редактирования ячейки заданной колонки
   * @param  col Колонка
   * @return     Можно ли редактировать
   */
  public canEditColumnCell(col: Column) {
    if (col === null) {
      return false;
    }

    if (col.editorComponentType !== null) {
      return this.editorShowMode !== EditorShowMode.NONE;
    }

    if (col.type === ColumnType.REFERENCE) {
      // Запрещаем для этого типа, если не задан компонент редактора
      return false;
    }

    return this.editorShowMode !== EditorShowMode.NONE && col.allowEdit;
  }
}
