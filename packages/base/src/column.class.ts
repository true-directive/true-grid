/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { ColumnType, GridPart } from './enums';
import { FilterOperator, Filter } from './filter.class';
import { Summary, SummaryType } from './summary.class';

/**
* Колонка грида. Содержит:
*   - отображаемое поле,
*   - текст заголовка,
*   - тип данных,
*   - заданную ширину колонки,
*   - параметры расчета ширины для опции columnAutoWidth,
*   - расчитанную ширину колонки (при включенной опции грида columnAutoWidth),
*   - классы, используемые при генерации разметки,
*   - наложенные фильтры,
*   - итоги,
*   - настройки, касающиеся колонок
*/
export class Column {

  /**
   * Сonstructor
   * @param fieldName Отображаемое поле
   * @param caption   Заголовок колонки. Если не задано, будет отображено
   * наименование поля.
   * @param width     Ширина (в заданных единицах измерения)
   * @param {ColumnType} dataType  Тип данных (see [[ColumnType]]).
   * Если не задано, принимается равным ColumnType.STRING.
   * @param band=''   Заголовок группы колонок
   * @param format='' Формат вывода значения
   */
  constructor(
    public fieldName: string,
    public caption: string = null,
    public width: number = 150,
    public type: ColumnType = ColumnType.STRING,
    public band = '',
    public format = '') {

    if (this.caption === null)  {
      this.caption = fieldName;
    }

    if (!this.type) {
      this.type = ColumnType.STRING;
    }

    // Default width of column
    if (!this.width) {
      this.width = 150;
    }
  }

  // -- Параметры автоматического расчета ширины колонки -----------------------

  /**
   * Минимальная ширина в заданных единицах измерения. Ни при каких условиях
   * ширина колонки не будет меньше заданного здесь значения
   */
  public autoWidthMin: number = undefined;

  /**
   * Приоритет отображения. Если ширины клиентской части грида не хватает,
   * чтобы уместить колонку с её минимальным размером, то первыми перестанут
   * отображаться колонки, приоритет которых минимален.
   * Если приоритет не задан, то они никогда не перестают отображаться.
   */
  public autoWidthPriority: number = 0; // undefined;

  /**
   * Фиксированная ширина колонки. Не будет пересчитываться.
   */
  public autoWidthFixed = false;

  // -- Немного настроек -------------------------------------------------------

  /**
   * Разрешено ли пользователю изменять ширину колонки
   */
  public columnResize = true;

  /**
   * Разрешено ли пользователю перемещать эту колонку
   */
  public columnReorder = true;

  /**
   * Разрешен ли фильтр по колонке
   */
  public allowFilter = true;

  /**
   * Показывать колонку в таблице, если по ней произведена группировка
   * (данная опция пока отклчючена)
   */
  public showIfGrouped = false;

  /**
   * Разрешено ли редактирование данных в этой колонке
   */
  public allowEdit = true;

  /**
   * Видимость колонки
   */
  public visible = true;

  /**
   * Список итогов колонки
   */
  public readonly summaries: Summary[] = [];

  /**
   * Признак того, что колонка является временной при перемещении
   */
  public temp = false;

  /**
   * В какой части грида находится колонка. По умолчанию - в основной центральной
   * части.
   */
  public fixed: GridPart = GridPart.CENTER;

  /**
   * Расчетная ширина при отображении
   */
  public displayedWidth: number;

  /**
   * Расчетная ширина заголовка колонки
   */
  public headerWidth: number;

  /**
   * Ширина при отображении с единицей измерения
   */
  public displayedWidthU = '';

  /**
   * Ширина заголовка с единицей измерения
   */
  public displayedHeaderWidth = '';

  /**
   * Отображаемое поле.
   * Если задано, то вместо заданного в свойстве [fieldName] поля отображается это.
   * Например, чтобы сортировка и фильтры производились по значению,
   * а отображалось отформатированное значение.
   * Также используется, когда к какому-то идентификатору привязано текстовое значение.
   * При редактировании отображается исходное значение.
   */
  public displayField = '';

  /**
   * Поле, содержащее ссылку для полей с dataType = ColumnType.REFERENCE
   */
  public referenceField = '';

  /**
   * Target of the
   */
  public referenceTarget = '';

  /**
   * Общий класс для всех ячеек колонки
   */
  public class = '';

  /**
   * Поле, из которого можно получить класс ячейки конкретной строки
   */
  public classField = '';

  /**
   * Тип компонента, который будет вставлен во все ячейки колонки вместо
   * значения (см. Cell components)
   */
  public cellComponentType: any = null;

  /**
   * Тип компонента, который будет использован как редактор для ячеек этой колонки
   */
  public editorComponentType: any = null;

  /**
   * Тип компонента, который будет использован как фильтр
   */
  public filterComponentType: any = null;

  /**
   * Чекбокс, находящийся в заголовке отмечен
   */
  private _checked ? = false;

  /**
   * Источник данных для выпадающего списка при редактировании.
   * Ожидается массив или Observable
   */
  public optionsData: any = null;

  /**
   * Список колонок выпадающего списка при редактировании
   * Если не задан, то будет создана одна колонка с полем name.
   */
  public optionsColumns: Column[] = null;

  /**
   * Узначем, отмечен ли чекбокс в заголовке колонки
   */
  public get isChecked(): boolean {
    return this._checked;
  }

  /**
   * Устанавливаем, отмечен ли чекбокс в заголовке колонки
   */
  public setChecked(v: boolean) {
    this._checked = v;
  }

  /**
   * Является ли колонка
   */
  get isCheckbox() {
    return this.type === ColumnType.CHECKBOX;
  }

  /**
   * Содержит ли колонка числовые значения
   */
  get isNumeric() {
    return this.type === ColumnType.NUMBER;
  }

  /**
   * Содержит ли колонка boolean значения
   */
  get isBoolean() {
    return this.type === ColumnType.BOOLEAN;
  }

  /**
   * Может ли в значении колонки находиться текстовое содержимое
   * @return True, если может
   */
  get isText() {
    return this.type === ColumnType.STRING ||
           this.type === ColumnType.REFERENCE ||
           this.type === ColumnType.HTML ||
           this.type === ColumnType.UNSAFE_HTML;
  }

  /**
   * Можно ли пользователю менять порядок этой колонки (перетаскивание мышью за
   * заголовок колонки)
   * @return True, если можно
   */
  get canReorder(): boolean {
    if (this.isCheckbox) {
      return false;
    }
    return this.columnReorder;
  }

  /**
   * Можно ли пользователю менять ширину колонки
   * @return True, если можно
   */
  get canResize(): boolean {
    if (this.isCheckbox) {
      return false;
    }
    return this.columnResize;
  }

  /**
   * Создание фильтра для колонки перед его редактированием.
   * @param  v Значение по умолчанию (берется из выделенной строки, если есть)
   * @return Фильтр для колонки
   */
  public createFilter(v: any, operator: FilterOperator = null): Filter {

    let res = null;
    let items: any[] = [];
    let value1: any = null;
    let value2: any = null;

    if (this.type === ColumnType.STRING
      || this.type === ColumnType.REFERENCE
      || this.type === ColumnType.HTML
      || this.type === ColumnType.UNSAFE_HTML
      ) {
      operator = operator !== null ? operator : FilterOperator.CONTAINS;
    } else {
      if (this.type === ColumnType.BOOLEAN) {
        operator = operator !== null ? operator : FilterOperator.SET;
      } else {
        operator = operator !== null ? operator : FilterOperator.BETWEEN;
      }
    }

    switch(operator) {
      case FilterOperator.BETWEEN:
      case FilterOperator.NOT_BETWEEN:
        if (Array.isArray(v) && v.length === 2) {
          value1 = v[0];
          value2 = v[1];
        } else {
          value1 = v;
          value2 = v;
        }
        break;
      case FilterOperator.SET:
        if (Array.isArray(v)) {
          items = v;
        } else {
          items.push(v);
        }
        break;
      default:
        value1 = v;
        value2 = v;
    }

    res = new Filter(this.fieldName, operator, value1, value2, items);

    res.format = this.format;
    res.caption = this.caption;
    res.type = this.type;

    return res;
  }

  /**
   * Добавление итога по колонке
   * @param  t {SummaryType} Тип суммирования
   * @return {Summary} Вся необходимая информация для подсчета итогов
   */
  public addSummary(t: SummaryType) {
    this.summaries.push(new Summary(t));
  }

  /**
   * Изменение итога по колонке. Добавляет или удаляет или изменяет
   * итог по колонке.
   * @param  t  {SummaryType} Тип суммирования
   * @param  a  {Summary} Текущее суммирование. Если не задан, то удаляются все имеющиеся
   * итоги. Если задано, то это суммирование заменяется на новое, или удаляется в случае,
   * если тип суммирования не задан
   */
  public setSummary(t: SummaryType, a: Summary = null) {
    if (a === null) {
      // Обнуляем список суммирований
      this.clearSummaries();
      if (t !== null) {
        this.summaries.push(new Summary(t));
      }
    } else {
      if (t === null) {
        // Удаляем
        this.summaries.splice(this.summaries.indexOf(a), 1);
      } else {
        // Меняем
        a.type = t;
      }
    }
  }

  public clearSummaries() {
    this.summaries.splice(0, this.summaries.length);
  }

  /**
   * Клонирование колонки
   * @return Возвращает новый instance класса Column с такими же свойствами, что и текущая колонка
   */
  clone(): Column {
    const res = new Column(this.fieldName, this.caption, this.width, this.type,
      this.band, this.format);
    res.allowEdit = this.allowEdit;
    return res;
  }
}
