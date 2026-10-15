import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

export interface IDynamicFormConfig {
  cssClasses: string;
  inputControls: IDynamicInputControl[];
}

export interface IDynamicInputControl {
  id: number;
  type: string;
  label?: string;
  cssClasses?: string;
  name?: string;
  validators?: IDynamicFormValidators;
  options?: any[] | ICheckBoxOption[];
  optionValue?: string;
  optionLabel?: string;
  value?: string;
  emptyLabel?: string;
  clearable?: boolean;
}

export interface IDynamicFormValidators {
  min?: number;
  max?: number;
  required?: boolean;
  requiredTrue?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  nullValidator?: boolean;
  routingNumberValidator?: boolean;
  routingNumberValidatorAPI?: boolean;
}

export interface ICheckBoxOption {
  id: string;
  name: string;
  value: any;
}
export interface IDynamicInputEvent {
  value: any;
  controlDetails: IDynamicInputControl;
  formControlItem: UntypedFormControl;
}

export interface IDynamicFormReadyResponse {
  dynamicForm: UntypedFormGroup;
  componentFunctions: IDynamicFormfunctions;
}

export interface IDynamicFormfunctions {
  setValidationMessage(controlName: string, message: string): void;
}
