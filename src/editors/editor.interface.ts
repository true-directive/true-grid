/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { EventEmitter } from '@angular/core';

import { Column } from '@true-directive/base';

import { GridStateService } from '../grid-state.service';

export interface IEditor {

  // Через state сможем взаимодействовать с внешним миром
  state: GridStateService;

  // Из параметров колонки сможем получить формат и данные для выпадающих списков
  column: Column;

  // Возможно, способ редактирования значения будет зависеть от других данных
  // в строке
  row: any;

  // Изменение значения (но без подтверждения)
  change: EventEmitter<any>;

  // Подтверждение нового значения
  commit: EventEmitter<any>;

  // Отмена редактирования
  cancel: EventEmitter<void>;

  // Инициализация редактора
  // Аргументы: начальное значение, высота строки, в которую встраивается редактор,
  // является ли браузер Internet Explorer
  init(value: any, valueChanged: boolean, height: number, ie: boolean, wasShown: boolean): void;
}
