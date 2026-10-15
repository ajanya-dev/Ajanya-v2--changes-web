import { Component, Input } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgIf, NgClass } from '@angular/common';

/**
 * @description Component for displaying validation error message.
 */
@Component({
  selector: 'app-control-message',
  templateUrl: './control-message.component.html',
  styleUrls: ['./control-message.component.scss'],
  standalone: true,
  imports: [NgIf, NgClass]
})
export class ControlMessageComponent {
  @Input() control!: UntypedFormControl;
  @Input() labelName = '';
  @Input() customCssClass = '';

  /**
   * Getter method for validation error message.
   * @returns boolean for valid/invalid status.
   */
  get errorMessage(): boolean {
    for (const propertyName in this.control?.errors) {
      if (
        this.control.errors.hasOwnProperty(propertyName) &&
        this.control.touched
      ) {
        return ValidationService.getValidationErrorMessage(
          propertyName,
          this.control.errors[propertyName],
          this.labelName
        );
      }
    }
    return false;
  }
}
