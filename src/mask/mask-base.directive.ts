/**
 * Copyright (c) 2018-2019 Aleksey Melnikov, True Directive Company.
 * @link https://truedirective.com/
 * @license MIT
*/
import { Output, Directive, ElementRef, Renderer2, EventEmitter, OnDestroy } from '@angular/core';
import { Mask } from '@true-directive/base';
import { Keys, KeyInfo } from '@true-directive/base';
import { MaskSectionAction, MaskResult } from '@true-directive/base';
import { MaskSettings } from '@true-directive/base';
import { MaskState } from '@true-directive/base';

import { InternationalizationService } from '../internationalization/internationalization.service';
import { Locale } from '@true-directive/base';

export abstract class MaskBaseDirective implements OnDestroy {

    private _undo: Array<MaskResult> = [];
    private _redo: Array<MaskResult> = [];

    // Current text value
    protected _txtValue = '';
    protected readonly _mask: Mask = new Mask();

    private _localeSubscription: any;

    protected android_behavior = false;
    protected last_res: MaskResult;

    // On state change
    @Output('stateChange')
    stateChange = new EventEmitter<MaskState>();

    // Fetching mask state
    private _state: MaskState = null;

    public get state(): MaskState {
      return this._state;
    }

    public set state(v: MaskState) {
      if (this._state !== v) {
        this._state = v;
        this.stateChange.emit(this._state); // Emitting event
      }
    }

    protected updateState() {
      //
    }

    protected processAndroid(txt: any): void {

      const res = this.currentRes();

      // Possibly we have carriage position
      const key: KeyInfo = Keys.whichKeyHasBeenPressed(this.last_res.newValue, txt,
          this.last_res.selStart, res.selStart, this.last_res.selLength);

      const r = this.processKey(
        {
          keyCode: -1,
          key: key.code,
          char: key.char,
          shiftKey: false,
          ctrlKey: false,
          target: { selectionStart: this.last_res.selStart, selectionEnd: 0 },
          preventDefault: (_: any) => {}
        });

      if (!r) {
        this.setRes(this.last_res); // Reversing, value has not been accepted
      }

      this.android_behavior = false;
      return;
    }

    protected doInput(txt: any) {
      if (this.android_behavior) {
        this.processAndroid(txt);
        return;
      }

      // Thus we're trying to apply a mask to value entered
      const masked = this._mask.applyMask(txt);
      if (masked !== this._txtValue) {
        this.setText(masked, true);
      }
    }

    public processKey(e: any): boolean {

      if (e.keyCode === 229 || e.keyCode === 0 || e.keyCode === undefined) {
        // Android detected
        this.android_behavior = true;
        this.last_res = this.currentRes();
        return;
      }

      let c: string = e.char;
      if (c === undefined) {
        c = e.key;
      }

      let selStart: number = e.target.selectionStart;
      let selEnd: number = e.target.selectionEnd;
      let s = this._txtValue;

      if (Keys.isFunctional(e.keyCode)) {
        return true;
      }

      if (e.keyCode === Keys.TAB || e.keyCode === Keys.ESCAPE) {
        return true;
      }

      if (e.keyCode === Keys.HOME || e.keyCode === Keys.END) {
        return true;
      }

      if (e.shiftKey && (e.keyCode === Keys.DELETE || e.keyCode === Keys.INSERT)) {
        return true;
      }

      if (e.altKey && (e.keyCode === Keys.DOWN || e.keyCode === Keys.UP)) {
        return true;
      }

      if (e.ctrlKey && e.keyCode === Keys.Z) {
        // UNDO
        const undoRes = this._undo.pop();
        if (undoRes) {
          this._redo.push(this.getRes(s, selStart, selEnd));
          this.setRes(undoRes);
        }
        e.preventDefault();
        return false;
      }

      if (e.ctrlKey && e.keyCode === Keys.Y) {
        // REDO
        const redoRes = this._redo.pop();
        if (redoRes) {
          this._undo.push(this.getRes(s, selStart, selEnd));
          this.setRes(redoRes);
        }
        e.preventDefault();
        return false;
      }

      // Остальные Ctrl+* нас не интересуют
      if (e.ctrlKey) {
        return true;
      }

      // If everything is selected
      if (selStart === 0 && selEnd === this._txtValue.length) {
        if (e.keyCode === Keys.DELETE || e.keyCode === Keys.BACKSPACE) {
          return true;
        }

        // If ArrowLeft key has been pressed, result should equal to pressing of Home
        if (e.keyCode === Keys.LEFT) {
          return true;
        }

        if (e.keyCode === Keys.RIGHT) {
          return true;
        }
      }

      if (selStart === 0 && selEnd === this._txtValue.length) {
        s = '';
        selStart = 0;
        selEnd = 0;
      }

      // Applying everything that's left
      const res: MaskResult = this._mask.applyKeyAtPos(s, e.keyCode, c, selStart, selEnd);      
      if (res !== null && res.action === MaskSectionAction.APPLY) {
        // If value has been changed we'll add it to UNDO stack
        if (res.newValue !== s) {
          this._undo.push(this.getRes(s, selStart, selEnd));
          this._redo = [];
        }

        this.setRes(res);

        if (this.android_behavior) {
          return true;
        }

        e.preventDefault();
      }

      return false;
    }

    // Setting value and carriage position
    protected setRes(res: MaskResult) {

      if (this.android_behavior) {
        res.selLength = 0;
      }

      this.setText(res.newValue);
      this._renderer.setProperty(this._elementRef.nativeElement, 'selectionStart', res.selStart);
      this._renderer.setProperty(this._elementRef.nativeElement, 'selectionEnd', res.selStart + res.selLength);
    }

    protected currentRes() {
      const res = new MaskResult(this._txtValue, MaskSectionAction.APPLY, 0);
      res.selStart = this._elementRef.nativeElement.selectionStart;
      res.selLength = this._elementRef.nativeElement.selectionEnd - res.selStart;
      return res;
    }

    // Retrieving current mask value and carriage position
    protected getRes(s: string, selStart: number, selEnd: number): MaskResult {
      const res = new MaskResult(s, MaskSectionAction.APPLY, 0);
      res.selStart = selStart;
      res.selLength = selEnd - selStart;
      return res;
    }

    // Following method should be overridden
    protected abstract toModel(): void;

    // Writing a text to control
    protected setText(displayedValue: string, toModel: boolean = true) {

      // Displaying
      this._txtValue = displayedValue;
      this._renderer.setProperty(this._elementRef.nativeElement, 'value', this._txtValue);

      // Sending to model
      if (toModel) {
        this.toModel();
      }
    }

    protected setLocale(locale: Locale) {
      this._mask.setLocale(locale);
    }

    ngOnDestroy() {
      this._localeSubscription.unsubscribe();
    }

    constructor(protected _renderer: Renderer2, protected _elementRef: ElementRef, protected intl: InternationalizationService) {
      this._localeSubscription = this.intl.onLocaleChanged.subscribe(locale => this.setLocale(locale));
    }
}
