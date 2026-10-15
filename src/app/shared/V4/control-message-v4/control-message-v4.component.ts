import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * @description Component for displaying validation error message.
 */
@Component({
  selector: 'app-control-message-v4',
  templateUrl: './control-message-v4.component.html',
  styleUrls: ['./control-message-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatTooltipModule]
})
export class V4ControlMessageComponent {
  control = input<AbstractControl>(new FormControl());
  isMarginTopEnabled = input(true);
  isMarginBottomEnabled = input(false);
  isErrorMessageCentered = input(false);
  marginTopOverride = input('mt-1');
  label = input('');
  tooltip = input('');
  customMessages = input<{ [key: string]: string }>({});

  /**
   * @description Retrieves the error message for the control.
   * @returns {string} The error message for the control, or false if no errors are found.
   */
  get errorMessage(): string {
    const control = this.control();
    const errorEntries = Object.entries(control?.errors || {});
    let result = '';

    errorEntries.forEach(([propertyName, propertyValue]) => {
      if (control.touched) {
        if (this.customMessages()[propertyName]) {
          result = this.customMessages()[propertyName];
          return;
        }
        if (propertyName === 'required') {
          result = 'This field is required';
          return;
        }
        result = ValidationService.getValidationErrorMessage(
          propertyName,
          propertyValue,
          this.label()
        );
      }
    });
    return result;
  }
}
