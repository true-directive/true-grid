import { Dates } from '../src/common/dates.class';

describe(`Dates (4/19/2019)`, () => {
  const a: Date = null;
  const a_u: Date = undefined;
  const resNull = Dates.getTimeNull(a);
  const resUndefined = Dates.getTimeNull(a_u);

  it(`getTimeNull(null) must be null`, () => expect(resNull).toBeNull());
  it(`getTimeNull(undefined) must be null`, () => expect(resUndefined).toBeNull());

  const d1 = new Date(2019, 3, 19);
  const d2 = new Date(2019, 3, 19);
  const d3 = new Date(2019, 3, 20);

  const resNotNull = Dates.getTimeNull(d1);
  it(`getTimeNull() of date must be not null`, () => expect(resNotNull).not.toBeNull());
  it(`Dates.equals() of same dates must be true`, () => expect(Dates.equals(d1, d2)).toBeTruthy());
  it(`Dates.equals() of different dates must be false`, () => expect(Dates.equals(d1, d3)).toBeFalsy());
  it(`Dates.equals(null, null) must be true`, () => expect(Dates.equals(null, null)).toBeTruthy());
  it(`Dates.equals(null, d1) must be false`, () => expect(Dates.equals(null, d1)).toBeFalsy());
  it(`Dates.equals(d1, null) must be false`, () => expect(Dates.equals(d1, null)).toBeFalsy());

  it(`Dates.compare() of '4/19/2019' and '4/20/2019 must be -1`, () => expect(Dates.compare(d1, d3)).toBe(-1));
  it(`Dates.compare() of '4/19/2019' and '4/19/2019 must be 0`, () => expect(Dates.compare(d1, d2)).toBe(0));
  it(`Dates.compare() of '4/20/2019' and '4/19/2019 must be 1`, () => expect(Dates.compare(d3, d1)).toBe(1));
  it(`Dates.compare(null, null) must be 0`, () => expect(Dates.compare(null, null)).toBe(0));
  it(`Dates.compare(d1, null) must be 1`, () => expect(Dates.compare(d1, null)).toBe(1));
  it(`Dates.compare(null, d1) must be -1`, () => expect(Dates.compare(null, d1)).toBe(-1));

  const today = Dates.today();
  const yesterday = Dates.yesterday();

  const nextDateRes = Dates.getTimeNull(Dates.nextDate(yesterday));
  const todayTime = Dates.getTimeNull(today);

  it(`Dates.nextDate() of yesterday must be today`, () => expect(nextDateRes).toBe(todayTime));

  const addDaysRes = Dates.getTimeNull(Dates.addDays(yesterday, 1));

  it(`Yesterday + 1 = Today`, () => expect(addDaysRes).toBe(todayTime));

  const fdw = Dates.getTimeNull(new Date(2019, 3, 14));
  const fdwres = Dates.getTimeNull(Dates.firstDateOfWeek(d1, 0));
  it(`First date of week must be 4/14/2019`, () => expect(fdwres).toBe(fdw));

  const fdw1a = new Date(2019, 3, 14);
  const fdw1 = Dates.getTimeNull(new Date(2019, 3, 8));
  const fdwres1 = Dates.getTimeNull(Dates.firstDateOfWeek(fdw1a, 1));
  it(`First date of week with date 4/14/2019 must be 4/8/2019 (first day is monday)`, () => expect(fdwres1).toBe(fdw1));

  const ldw = Dates.getTimeNull(new Date(2019, 3, 20));
  const ldwres = Dates.getTimeNull(Dates.lastDateOfWeek(d1, 0));
  it(`Last date of week must be 4/20/2019`, () => expect(ldwres).toBe(ldw));

  const ldpw = Dates.getTimeNull(new Date(2019, 3, 13));
  const ldpwres = Dates.getTimeNull(Dates.lastDateOfPrevWeek(d1, 0));
  it(`Last date of previous week must be 4/13/2019`, () => expect(ldwres).toBe(ldw));

  const fdnw = Dates.getTimeNull(new Date(2019, 3, 21));
  const fdnwres = Dates.getTimeNull(Dates.firstDateOfNextWeek(d1, 0));
  it(`First date of next week must be 4/21/2019`, () => expect(fdnwres).toBe(fdnw));

  it(`3/15/2019 between 3/1/2019 and 4/1/2019`, () =>
        expect(Dates.dateBetween(new Date(2019,2,15), new Date(2019,2,1), new Date(2019,3,1))).
        toBeTruthy()
  );

  it(`3/15/2019 not between 3/16/2019 and 4/1/2019`, () =>
        expect(Dates.dateBetween(new Date(2019,2,15), new Date(2019,2,16), new Date(2019,3,1))).
        toBeFalsy()
  );

  it(`First date of next month must be 3/1/2019`, () =>
        expect(Dates.getTimeNull(Dates.firstDateOfPrevMonth(d1))).
        toBe(Dates.getTimeNull(new Date(2019, 2, 1)))
  );

  it(`Last date of prev month must be 3/31/2019`, () =>
        expect(Dates.getTimeNull(Dates.lastDateOfPrevMonth(d1))).
        toBe(Dates.getTimeNull(new Date(2019, 2, 31)))
  );

  it(`Last date of next month must be 5/31/2019`, () =>
        expect(Dates.getTimeNull(Dates.lastDateOfNextMonth(d1))).
        toBe(Dates.getTimeNull(new Date(2019, 4, 31)))
  );

  it(`First date of next month must be 5/1/2019`, () =>
        expect(Dates.getTimeNull(Dates.firstDateOfNextMonth(d1))).
        toBe(Dates.getTimeNull(new Date(2019, 4, 1)))
  );

  const sameMonthDate = new Date(2019, 3, 1);
  const notSameMonthDate = new Date(2019, 2, 31);
  it(`isSameMonth([4/19/2019], [4/1/2019]) = true`, () => expect(Dates.isSameMonth(d1, sameMonthDate)).toBeTruthy());
  it(`isSameMonth([4/19/2019], [3/31/2019]) = false`, () => expect(Dates.isSameMonth(d1, notSameMonthDate)).toBeFalsy());
  it(`isSameMonth([4/19/2019], null) = false`, () => expect(Dates.isSameMonth(d1, null)).toBeFalsy());
  it(`isSameMonth(null, [3/31/2019]) = false`, () => expect(Dates.isSameMonth(null, notSameMonthDate)).toBeFalsy());

  const sameYearDate = new Date(2019, 9, 1);
  const notSameYearDate = new Date(2020, 0, 1);
  it(`isSameYear([4/19/2019], [10/1/2019]) = true`, () => expect(Dates.isSameYear(d1, sameYearDate)).toBeTruthy());
  it(`isSameYear([4/19/2019], [1/1/2020]) = false`, () => expect(Dates.isSameYear(d1, notSameYearDate)).toBeFalsy());
  it(`isSameYear([4/19/2019], null) = false`, () => expect(Dates.isSameYear(d1, null)).toBeFalsy());
  it(`isSameYear(null, [1/1/2020]) = false`, () => expect(Dates.isSameYear(null, notSameYearDate)).toBeFalsy());

  it(`yearTwoDigits = 19`, () => expect(Dates.yearTwoDigits(d1)).toBe('19'));
});
