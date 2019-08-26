/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
export class MaskState {

    static EMPTY = new MaskState('EMPTY');
    static TYPING = new MaskState('...');
    static OK = new MaskState('OK');

    constructor(public name: string) { }
}
