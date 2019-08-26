/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class Dates {

  public static isEmpty(d: Date): boolean {
    return d === null || d === undefined || d.getTime === undefined || d.getTime() === NaN;
  }

  /**
   * Returns timestamp of the given date or null
   * @param  d Date
   * @return   Timestamp or date's timestamp
   */
  public static getTimeNull(d: Date): number | null {
    if (d === null || d === undefined) {
      return null;
    }
    return d.getTime();
  }

  /**
   * Are two dates equal?
   * @param  d1 First date
   * @param  d2 Second date
   * @return    True if dates are equals.
   */
  public static equals(d1: Date, d2: Date): boolean {
    if (!d1 && !d2) {
      return true;
    }
    if (!d1 || !d2) {
      return false;
    }
    return d1.getTime() === d2.getTime();
  }

  /**
   * Comparing two dates.
   * @param  d1 First date.
   * @param  d2 Second date.
   * @return    True if both dates are equal.
   */
  public static compare(d1: Date, d2: Date): number {
    if (!d1 && !d2) {
      return 0;
    }
    if (!d1 && d2) {
      return -1;
    }
    if (d1 && !d2) {
      return 1;
    }
    if (d1.getTime() === d2.getTime()) {
      return 0;
    }
    return d1.getTime() > d2.getTime() ? 1 : -1;
  }

  /**
   * Returns today's date with no time.
   * @return Today's date with no time.
   */
  public static today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Returns yesterday's date without time.
   * @return Yesterday's date without time.
   */
  public static yesterday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  }

  /**
   * Returns the date following the specified date.
   * @param  d Date
   * @return The date following the date.
   */
  public static nextDate(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }

  /**
   * Returns a date that is more than the specified date for the specified number of days.
   * @param  d    Date
   * @param  days Number of days
   * @return
   */
  public static addDays(d: Date, days: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  }

  // Первая дата недели, включающей заданную дату
  public static firstDateOfWeek(d: Date, firstDay: number): Date {
    let day = d.getDay();
    if (firstDay > day) {
      day += 7;
    }
    day -= firstDay;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  }

  // Последняя дата недели, включающей заданную дату
  public static lastDateOfWeek(d: Date, firstDay: number): Date {
    const firstDate = Dates.firstDateOfWeek(d, firstDay);
    return new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + 6);
  }

  // Первая дата недели, которая следует за неделей, включающей заданную дату
  public static lastDateOfPrevWeek(d: Date, firstDay: number): Date {
    const firstDate = Dates.firstDateOfWeek(d, firstDay);
    return new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() - 1);
  }

  // Первая дата недели, которая следует за неделей, включающей заданную дату
  public static firstDateOfNextWeek(d: Date, firstDay: number): Date {
    const lastDate = Dates.lastDateOfWeek(d, firstDay);
    return new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1);
  }

  // Первая дата месяца, включающего заданную дату
  public static firstDateOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  // Последная дата месяца, включающего заданную дату
  public static lastDateOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  // Первая дата месяца, который следует за месяцем, включающим заданную дату
  public static firstDateOfNextMonth(d: Date): Date {
    const last = Dates.lastDateOfMonth(d);
    return new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  }

  // Последняя дата месяца, который следует за месяцем, включающим заданную дату
  public static lastDateOfNextMonth(d: Date): Date {
    return Dates.lastDateOfMonth(Dates.firstDateOfNextMonth(d));
  }

  // Первая дата месяца, который предшествует месяцу, включающему заданную дату
  public static firstDateOfPrevMonth(d: Date): Date {
    const last = Dates.lastDateOfPrevMonth(d);
    return Dates.firstDateOfMonth(last);
  }

  // Последняя дата месяца, который предшествует месяцу, включающему заданную дату
  public static lastDateOfPrevMonth(d: Date): Date {
    const first = Dates.firstDateOfMonth(d);
    return new Date(first.getFullYear(), first.getMonth(), first.getDate() - 1);
  }

  // Дата находится в интервале между двумя заданными датами (включительно)
  public static dateBetween(d: Date, start: Date, end: Date): boolean {
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
  }

  // Дата находится в том же месяце, что и вторая дата
  public static isSameMonth(d1: Date, d2: Date) {

    if (d1 === null || d1 === undefined) {
      return false;
    }

    if (d2 === null || d2 === undefined) {
      return false;
    }

    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  }

  // Дата находится в том же году, что и вторая дата
  public static isSameYear(d1: Date, d2: Date) {
    if (d1 === null || d1 === undefined) {
      return false;
    }

    if (d2 === null || d2 === undefined) {
      return false;
    }

    return d1.getFullYear() === d2.getFullYear();
  }

  public static yearTwoDigits(d: Date): string {
    const yy = d.getFullYear();
    return (yy + '').substring((yy + '').length - 2);
  }
}
