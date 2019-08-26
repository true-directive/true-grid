/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class NumberFormat {
  prefix  = '';
  postfix = '';

  // D - десятичная, E - экспоненциальная, F - шестнадцатеричная
  specifier = 'D';

  signum: boolean;          // Обязательно нужен знак (даже +)

  intMin = 1;
  intMax = 16;

  fractionMin = 0;
  fractionMax = 0;

  public static isDigit(char: string): boolean {
    if ('0123456789'.indexOf(char) >= 0) {
      return true;
    }
    return false;
  }

  // Формат в виде '${1.2}' -- префикс [$ ], потом минимум одна цифра целого, затем только две цифры после точки
  // Формат в виде '${1.2-5}' -- префикс [$ ], потом минимум одна цифра целого, затем от двух до пяти цифр дроби
  //  {E.4} - экспоненциальная форма с максимум 4 знаками после запятой
  // {+E.4} - обязательно знак
  public static parseFormat(formatTxt: string): NumberFormat {

      const splitted = formatTxt.split(/[\{\}]/);

      if (splitted.length < 3) {
        return null;
      }

      const res = new NumberFormat();

      res.prefix = splitted[0];
      const format = splitted[1].trim();
      res.postfix = splitted[2];

      const digits = { int: '', intMax: '', fMin: '', fMax: ''};

      let part = 'spec';
      for (let pos = 0; pos < format.length; pos++) {
        const char = format[pos];
        const isDigit = NumberFormat.isDigit(char);

        if (!isDigit && 'EDFNedfn+-. '.indexOf(char) < 0) {
          return null;
        }

        if (pos === 0 && '+-'.indexOf(char) >= 0) {
          res.signum = true;
        }

        // Задается спецификатор
        if (part === 'spec'  && 'EDFNedfn'.indexOf(char) >= 0) {
            res.specifier = char.toUpperCase();
            part = 'int';
            continue;
        }

        if ((part === 'spec' || part === 'int') && isDigit) {
          digits.int += char;
          part = 'int';
          continue;
        }

        if (part === 'int' && char === '-') {
          part = 'intmax';
        }

        if (part === 'intmax' && isDigit) {
          digits.intMax += char;
        }

        if (char === '.') {
          part = 'fmin';
        }

        if (part === 'fmin' && char === '-') {
          part = 'fmax';
        }

        if (part === 'fmin' && isDigit) {
          digits.fMin += char;
        }

        if (part === 'fmax' && isDigit) {
          digits.fMax += char;
        }
      }

      if (digits.int !== '') {
        res.intMin = +digits.int;
      }

      if (digits.intMax !== '') {
        res.intMax = +digits.intMax;
      }

      if (digits.fMin !== '') {
        res.fractionMin = +digits.fMin;
      }

      if (digits.fMax !== '') {
        res.fractionMax = +digits.fMax;
      } else {
        res.fractionMax = res.fractionMin;
      }

      return res;
    }
}
