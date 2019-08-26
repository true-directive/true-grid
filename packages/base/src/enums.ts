/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/**
 * Тип данных
 */
export class ColumnType {
  constructor(public name: string) { }

  static STRING = new ColumnType('String');
  static NUMBER = new ColumnType('Number');
  static DATETIME = new ColumnType('DateTime');
  static BOOLEAN = new ColumnType('Boolean');
  static REFERENCE = new ColumnType('Reference');
  static IMAGE = new ColumnType('Image');

  // Для такой колонки будут работать каскадные обновления значений
  // для группировок и деревьев (от родительской row к дочерней)
  static CHECKBOX = new ColumnType('Checkbox');

  // HTML разметка будет размещена во вложенном компоненте
  static HTML = new ColumnType('Html');

  // HTML разметка будет назначена в innerHTML ячейки
  static UNSAFE_HTML = new ColumnType('UnsafeHtml');

  // Будет создан компонент, тип которого задан в параметре
  // CellComponentType колонки
  static CUSTOM = new ColumnType('Component');
}

// Режим отслеживания изменений
export class DetectionMode {
  constructor(public name: string) { }

  // Стандартный режим Angular. Изменения автоматически влияют на представление.
  // Работает медленно при большом количестве строк. Переключите в MANUAL, если
  // ожидается более 100 строк в модели данных
  static DEFAULT = new DetectionMode('Default');

  // После внесения изменений в модель необходимо вручную вызвать метод
  // TrueGrid.detectChanges();
  static MANUAL = new DetectionMode('Manual');
}


/**
 * Части грида
 */
export class GridPart {
  constructor(public name: string) { }

  // Левые зафиксированный колонки
  static LEFT = new GridPart('left');

  // Основная центральная часть
  static CENTER = new GridPart('');

  // Правые зафиксированные ячейки
  static RIGHT = new GridPart('right');

  // Перетаскиваемый заголовок колонки или строка
  static DRAG_ITEM = new GridPart('dragItem');

  // Колонка, по которой сгруппированы данные (содержатся в области группировок)
  static GROUPED_COLUMN = new GridPart('groupedColumn');
}

/**
 *  Режим рендера строк
 */
export class RenderMode {
  constructor(public name: string) { }

  /**
   * Рендерятся все строки
   */
  static ALL = new RenderMode('All');

  /**
   * Рендерятся только видимые при текущей scroll position и несколько десятков
   * строк вверх и вниз (см. параметр prerenderRowCount).
   * Только ячейки, которые вписываются во вьюпорт по горизонтали
   */
  static VISIBLE = new RenderMode('Visible');

  /**
   * Рендерятся только видимые при текущей scroll position и несколько десятков
   * строк вверх и вниз (см. параметр prerenderRowCount).
   * Рендерятся все ячейки этих строк
   */
  static VISIBLE_ROWS = new RenderMode('VisibleRows');
}

/**
 * Способ перехода ячейки в режим редактирования
 */
export class EditorShowMode {

  constructor(public name: string) { }

  // Редактирование отключено
  static NONE = new EditorShowMode('NONE');

  // По нажатию кнопки мыши
  static ON_MOUSE_DOWN = new EditorShowMode('ON_MOUSE_DOWN');

  // При фокусировке ячейки
  static ON_FOCUS = new EditorShowMode('ON_FOCUS');

  // При клике по сфокусированной ячейки
  static ON_CLICK_FOCUSED = new EditorShowMode('ON_CLICK_FOCUSED');

  // При двойном клике по ячейке
  static ON_DBL_CLICK = new EditorShowMode('ON_DBL_CLICK');
}

/**
 * Способ выделения ячеек
 */
export class SelectionMode {

  constructor(public name: string, public range: boolean = false) { }

  /**
   * Выделяются только отдельные ячейки
   */
  static NONE = new SelectionMode('NONE');

  /**
   * Выделяются только отдельные ячейки
   */
  static CELL = new SelectionMode('CELL');

  /**
   * Выделяются отдельные строки целиком
   */
  static ROW = new SelectionMode('ROW');

  /**
   * Можно выбрать прямоугольные области
   */
  static RANGE = new SelectionMode('RANGE', true);

  /**
   * Выделяются отдельные строки, но при движении мышью выделяется
   * прямоугольная область
   */
  static ROW_AND_RANGE = new SelectionMode('ROW_AND_RANGE', true);
}

/**
 * Способ позиционирования всплывающих окон
 */
export class PopupPosition {
  constructor(public name: string) { }
  static RELATIVE = new PopupPosition('RELATIVE');
  static ABSOLUTE = new PopupPosition('ABSOLUTE');
  static MODAL = new PopupPosition('MODAL');
}
