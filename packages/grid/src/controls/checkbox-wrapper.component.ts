import { Component, Input } from "@angular/core";

/**
 * Checkbox wrapper component
 */
@Component({
  selector: "true-checkbox-wrapper",
  template:
    `<label class="true-checkbox"><ng-content select="[caption]"></ng-content>
      <ng-content select="input"></ng-content>
      <span class="true-checkbox__checkmark"></span>
    </label>`
  })
export class CheckboxWrapperComponent {

}
