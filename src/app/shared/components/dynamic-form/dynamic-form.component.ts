import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  OnDestroy
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ICheckBoxOption,
  IDynamicFormConfig,
  IDynamicFormReadyResponse,
  IDynamicInputControl,
  IDynamicInputEvent
} from 'src/app/models/dynamicForm';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

/**
 * @description Component for dynamic form.
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnChanges, OnDestroy {
  subscriptions: Subscription[] = [];
  loading = true;
  @Input() formConfig: IDynamicFormConfig;
  @Output() formReady = new EventEmitter<IDynamicFormReadyResponse>();
  @Output() valueInput = new EventEmitter<IDynamicInputEvent>();
  @Output() valueChange = new EventEmitter<IDynamicInputEvent>();

  formReadyResponse: IDynamicFormReadyResponse;

  public dynamicForm: UntypedFormGroup;
  customValidationMessages: { [key: string]: string } = {};

  constructor(
    private fb: UntypedFormBuilder,
    private _bankAccService: BankAccountsService
  ) {}

  ngOnChanges(): void {
    this.loading = false;
    this.createForm(this.formConfig.inputControls);
  }

  /**
   * @description Creates dynamic form, with the given controls.
   * @param controls - form controls.
   */
  createForm(controls: IDynamicInputControl[]): void {
    this.clearSubscriptions();
    this.dynamicForm = this.fb.group({});
    for (const control of controls) {
      if (control.type == 'header') {
        continue;
      }
      if (control.validators && control.name) {
        let newControl: UntypedFormControl | UntypedFormGroup;
        if (control.type == 'checkbox-group') {
          newControl = new UntypedFormGroup({});
          control.options?.forEach((checkbox: ICheckBoxOption) => {
            const checkboxControl = new UntypedFormControl(checkbox.value);
            (<UntypedFormGroup>newControl).addControl(
              checkbox.name,
              checkboxControl
            );
          });
        } else {
          newControl = new UntypedFormControl(control?.value ?? '');
        }
        if (control.validators) {
          for (const [key, value] of Object.entries(control.validators)) {
            switch (key) {
              case 'min':
                newControl.addValidators(Validators.min(Number(value)));
                break;
              case 'max':
                newControl.addValidators(Validators.max(Number(value)));
                break;
              case 'required':
                if (value) {
                  newControl.addValidators(Validators.required);
                }
                break;
              case 'requiredTrue':
                if (value) {
                  newControl.addValidators(Validators.requiredTrue);
                }
                break;
              case 'email':
                if (value) {
                  newControl.addValidators(Validators.email);
                }
                break;
              case 'minLength':
                newControl.addValidators(Validators.minLength(Number(value)));
                break;
              case 'maxLength':
                newControl.addValidators(Validators.maxLength(Number(value)));
                break;
              case 'pattern':
                newControl.addValidators(Validators.pattern(String(value)));
                break;
              case 'nullValidator':
                if (value) {
                  newControl.addValidators(Validators.nullValidator);
                }
                break;
              case 'routingNumberValidator':
                if (value) {
                  newControl.addValidators(
                    ValidationService.routingNumberValidator
                  );
                }
                break;
              case 'routingNumberValidatorAPI':
                this.subscriptions.push(
                  newControl.valueChanges.subscribe((res: string) => {
                    this.lookupRoutingNumber(res);
                  })
                );
                break;
              default:
                // eslint-disable-next-line no-console
                console.warn('Unknown validator', control);
                break;
            }
          }
        }
        this.dynamicForm.addControl(control.name, newControl);
      } else {
        // eslint-disable-next-line no-console
        console.warn("Input control missing 'name'", control);
      }
    }
    this.formReadyResponse = {
      dynamicForm: this.dynamicForm,
      componentFunctions: {
        setValidationMessage: this.setValidationMessage
      }
    };
    this.formReady.emit(this.formReadyResponse);
  }

  /**
   * @description Method to set custom validation messages.
   * @param controlName - name of the control for which custom message is given.
   * @param message - custom validation message.
   */
  setValidationMessage = (controlName: string, message: string): void => {
    this.customValidationMessages[controlName] = message;
  };

  /**
   * @description - Look up routing number and gets bank details and patch dynamic form.
   * @param event - route no.
   */
  lookupRoutingNumber(event: string): void {
    const rout_no = event;
    if (rout_no.length >= 9) {
      this.subscriptions.push(
        this._bankAccService.getroutingNumber(rout_no).subscribe((res) => {
          const bank_details = res.data;
          if (this.dynamicForm.contains('bankName')) {
            this.dynamicForm.patchValue({
              bankName: bank_details.name?.trim()
            });
          }
        })
      );
    }
  }

  /**
   * @description Emits `valueInput` event with params.
   * @param value - input event.
   * @param controlDetails - form control details.
   * @param formControlItem - form control.
   */
  onInput(
    value: unknown,
    controlDetails: IDynamicInputControl,
    formControlItem: UntypedFormControl
  ): void {
    this.valueInput.emit({ value, controlDetails, formControlItem });
  }

  /**
   * @description Emits `valueChange` event with params.
   * @param value - input event.
   * @param controlDetails - form control details.
   * @param formControlItem - form control.
   */
  onChange(
    value: unknown,
    controlDetails: IDynamicInputControl,
    formControlItem: UntypedFormControl
  ): void {
    this.valueChange.emit({ value, controlDetails, formControlItem });
  }

  /**
   * @description Method to unsubscribe all subscriptions.
   */
  clearSubscriptions() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    this.clearSubscriptions();
  }
}
