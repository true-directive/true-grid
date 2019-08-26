/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { SortInfo, SortType } from './sort-info.class';
import { Filter } from './filter.class';

/**
 * Запрос данных
 */
export class DataQuery {
  /**
   * Constructor
   * @param queryId       Идентификатор запроса. Ответ с данными должен содержать этот
   * же идентификтор. Если после этого запроса были другие, то ответ на этот запрос
   * игнорируется
   * @param filters       Список фильтров, наложенный на колонки
   * @param searchString  Общий фильтр по тексту
   * @param sortInfo      Информация о сортировке
   * @param groupedFields Список колонок, по которым произведена группировка. Необходимо
   * данные в ответе упорядочить сначала по этим колонкам, а затем в соответствии с sortInfo
   */
  constructor(
    public queryId: number,
    public filters: Filter[] = [],
    public searchString: string = '',
    public sortings: SortInfo[] = [],
    public groupedFields: string[] = [],
    public subject: any = null
  ) { }
}
