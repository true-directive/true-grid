/**
 * Положение строки относительно другой строки
 */
export class RowPosition {
  /**
   * RowLayout строки, относительно которой находится строка
   */
  public rl: any;

  /**
   * RowLayout строки, над которой находится курсор мыши
   */
  public rl_hover: any;

  /**
   * Положение строки относительно rl
   */
  public pos: string;
}
