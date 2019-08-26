/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
/**
 * Настройки внешнего вида грида.
 * В свойствах заданы классы, накладываемые на грид и на отдельные его части.
 * Можно заменить для кастомизации внешнего вида.
 */
export class GridAppearance {

  /**
   * Класс грида
   */
  public class = 'true-grid-appearance';

  /**
   * Класс данных грида
   */
  public dataClass = 'true-grid-data-appearance';

  /**
   * Класс области заголовков
   */
  public headerAreaClass = 'true-header-appearance';

  /**
   * Класс области футеров
   */
  public footerAreaClass = 'true-footer-appearance';

  /**
   * Класс подсветки ячейки, на которой находится фокус
   */
  public focusedCellClass = 'true-focused-cell-hl';

  /**
   * Отображение вертикальных границ ячеек данных
   */
  public verticalLines = true;

  /**
   * Отображение горизонтальных границ ячеек данных
   */
  public horizontalLines = true;

  /**
   * Отображение вертикальных границ ячеек заголовка
   */
  public headerVerticalLines = true;

  /**
   * Отображение горизонтальных границ ячеек заголовка
   */
  public headerHorizontalLines = true;

  /**
   * Отображение вертикальных границ ячеек футера
   */
  public footerVerticalLines = false;

  /**
   * Внешний вид заголовка группы первого уровня
   */
  public groupL1Class = 'true-group-l1';

  /**
   * Внешний вид заголовка групп всех уровней
   */
  public groupClass = 'true-group';

  /**
   * Класс состояния заголовка развернутой группы
   */
  public groupExpandedClass = 'true-expanded';

  /**
   * Класс состояния заголовка свёрнутой группы
   */
  public groupCollapsedClass = 'true-collapsed';

  /**
   * Переключатель видимости групп
   */
  public groupSwitcherClass = 'true-group-switcher';

  /**
   * Переключатель видимости групп первого уровня
   */
  public groupSwitcherL1Class = '';

  /**
   * Иконка переключателя развернутости группы (для развертывания)
   */
  public groupExpandIconClass = 'true-icon-right-open';

  /**
   * Иконка переключателя развернутости группы (для свертывания)
   */
  public groupCollapseIconClass = 'true-icon-down-open';

  /**
   * Класс иконки кнопки фильтра в заголовке колонки (фильтр выключен)
   */
  public filterBtnIconClass = 'true-icon-filter';

  /**
   * Класс иконки кнопки фильтра в заголовке колонки (фильтр включен)
   */
  public filterBtnIconClass_active = 'true-icon-filter true-accent';

  /**
   * Иконка индикатора сортирвки (по возрастанию)
   */
  public sortedUpIconClass = 'true-icon-up-dir';

  /**
   * Иконка индикатора сортирвки (по убыванию)
   */
  public sortedDownIconClass = 'true-icon-down-dir';

  /**
   * Класс чекбокса
   */
  public checkboxClass = 'true-cb';

  /**
   * Class of boolean value indicator (false value)
   */
  public booleanClass = 'true-bool';

  /**
   * Class of boolean value indicator (true value)
   */
  public booleanClass_checked = 'true-bool checked';

  /**
   * Класс для помеченных строк
   */
  public checkedRowClass = 'true-row-checked';

  /**
   * Выделение checked rows
   */
  public enableCheckedAppearance = true;

  /**
   * Анимированное появление содержимого группы
   */
  public groupShowFadeIn = false;

  //
  /**
   * Класс скроллбокса. Можно отдельно кастомизировать скроллбары
   */
  public scrollboxClass = '';

  /**
   * Класс перетаскиваемой item
   */
  public dragItemClass = 'true-grid-drag-item-appearance';

  /**
   * Подсветка ячейки, на которой находится фокус
   */
  public enableFocusedAppearance = true;

  /**
   * Подсветка строки, над которой находится курсор мыши
   */
  public enableHoverAppearance = false;

  /**
   * Список классов для заголовка
   * @return Строка с классами через пробел
   */
  public getHeaderClass() {
    let res = ''; // this.headerClass;
    if (this.headerVerticalLines) {
      res = ' true-v-lines';
    }
    if (this.headerHorizontalLines) {
      res += ' true-h-lines';
    }
    return res;
  }

  /**
   * Список классов для футера
   * @return Строка с классами через пробел
   */
  public getFooterClass() {
    let res = ''; //this.footerClass;
    if (this.footerVerticalLines) {
      res += ' true-v-lines';
    }
    return res;
  }

  /**
   * Список классов для области данных
   * @return Строка с классами через пробел
   */
  public getDataClass() {
    let res = this.dataClass;
    if (this.verticalLines) {
      res += ' true-v-lines';
    }
    if (this.horizontalLines) {
      res += ' true-h-lines';
    }
    if (this.enableFocusedAppearance) {
      res += ' ' + this.focusedCellClass;
    }
    if (this.enableHoverAppearance) {
      res += ' true-hovered-row-hl';
    }
    return res;
  }
}
