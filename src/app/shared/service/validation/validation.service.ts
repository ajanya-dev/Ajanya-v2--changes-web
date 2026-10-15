import { inject, Injectable } from '@angular/core';
import { Country } from 'src/app/data/data/country-list';
import {
  AbstractControl,
  FormControl,
  UntypedFormControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { IBankDropdown } from 'src/app/models/bank';
import { IRequiredDocsValue } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  static matchingText: string;
  private localStorageService = inject(LocalStorageService);


  public static getValidationErrorMessage(
    validatorName: string,
    validatorValue?: any,
    labelName?: string
  ): any {    
    const data = {
      required: labelName ? labelName : 'This field is required',
      invalidPassword: `Invalid password. Password must be at least 6 characters long, and contain a number.`,
      maxlength: `The field can't contain more than ${validatorValue.requiredLength} characters.`,
      minlength: `The field must contain at least ${validatorValue.requiredLength} characters.`,
      invalidEmailAddress: `Invalid email address`,
      invalidPhoneNumber: `Invalid phone number.`,
      invalidPhoneLength: 'This field requires 10 digits',
      invalidRoutingNumber: `Invalid Routing Number`,
      invalidAccountNumber: `Invalid Account Number`,
      invalidUrl: `Invalid URL`,
      invalidZip: `Enter valid zip.`,
      minLength: `The field must contain at least ${validatorValue.requiredLength} characters.`,
      maxLength: `The field can't contain more than ${validatorValue.requiredLength} characters.`,
      alphabetsAndSpaces: `Only alphabets and spaces are allowed`,
      min: labelName ? labelName : `Minimum value must be ${validatorValue.min}`,
      max: labelName ? labelName : `Maximum value must be ${validatorValue.max}`,
      hasWhitespace: labelName ? labelName : 'This field has whitespace',
      accountNoMismatch: 'Incorrect account number',
      pattern: '',
      poBox: 'PO Box address not allowed',
      invalidMatch: this.matchingText,
      specialChar: "Special characters are not allowed",
      achVerificationRequired: "Bank Account is not ACH verified",
      insufficientBalance: "Selected wallet has insufficient balance for the minimum transfer amount.",
      customMinLength:`This field must contain at least ${validatorValue.requiredLength} characters.`,
      sameEmailAddress: `The sender's email and the payee's email must be different.`, 
      confirmPassword: "Password does not match",
      invalidZipLength:`Zip code must be 5 digits`,
      minDate: "Please select a future date.",
      payrollBackDatedLimit: `Payroll check date cannot be older than ${validatorValue?.days} days.`,
      futureDate: "Date of birth cannot be in the future",
      minAge: "Person must be at least 18 years old",
      maxAge: "Please enter a valid date of birth",
      tagValidation: "Invalid characters detected",
      invalidNameChars: "Special characters are not supported",
      invalidNameLength: `The name must contain at least ${validatorValue?.minLength} characters.`,
      invalidNameLetter: "The name must contain at least one letter.",
      legalNameMismatch: `Account holder name must match the payee's legal name "${validatorValue?.legalName}".`,
      serverError: validatorValue
    };

    if (validatorName == 'pattern') {
      if (validatorValue?.requiredPattern == '^[a-zA-Z0-9 ]+$') {
        data.pattern =
          'The field must contain characters, numbers and spaces only.';
      }
    }
    const vName = validatorName as keyof typeof data;    
    return data[vName];
  }

  // PASSWORD
  passwordValidator(control: AbstractControl): any {
    if (!control.value) {
      return;
    }

    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    // (?!.*\s)          - Spaces are not allowed
    return control.value.match(
      /^(?=.*\d)(?=.*[a-zA-Z!@#$%^&*])(?!.*\s).{6,100}$/
    )
      ? { invalidPassword: false }
      : { invalidPassword: true };
  }

  static customMinLength = (length: number) => (control: AbstractControl) => {
    const phone = String(control.value).replace(/[^0-9]/g, '');
    if (control.value === null || control.value === '') {
      return null;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const element of Country.countryList()) {
      const dialcode = element.dial_code.replace(/[^0-9]/g, '');
      const minLength = element.length?.min ?? length;
      const phoneNumberRegex = new RegExp(`^${dialcode}(.{${minLength},})$`);
      if (phoneNumberRegex.test(phone)) {
        return null;
      }
    }
    return { customMinLength: {requiredLength:length} };
  };


  // EMAIL
  static emailValidator(control: AbstractControl): any {
    const email = String(control.value);

    if (control.value == null || control.value == '') {
      return true;
    }
    // if (!control.value) { return { invalidEmailAddress: true }; }

    const emailPattern = /^([\w.-]+@([\w-]+\.)+[\w-]{2,15})?$/;

    if (email.match(emailPattern)) {
      return false;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail !== email && trimmedEmail.match(emailPattern)) {
      return { hasWhitespace: true };
    }

    return { invalidEmailAddress: true };
  }

  static isMatchingValidator(
    confirmInput: string,
    matchingTextFromComponent: string
  ): any {
    let checkingFieldOne: UntypedFormControl;
    let checkingFieldTwo: UntypedFormControl;
    this.matchingText = matchingTextFromComponent;

    return (control: UntypedFormControl) => {
      if (!control.parent) {
        return null;
      }

      if (!checkingFieldOne) {
        checkingFieldOne = control;
        checkingFieldTwo = control.parent.get(
          confirmInput
        ) as UntypedFormControl;
        checkingFieldTwo.valueChanges.subscribe(() => {
          checkingFieldOne.updateValueAndValidity();
        });
      }

      if (
        checkingFieldTwo?.value?.toLocaleLowerCase() !==
        checkingFieldOne?.value?.toLocaleLowerCase()
      ) {
        return {
          invalidMatch: true
        };
      }

      return null;
    };
  }

  // PHONE NUMBER

  static phoneNumberValidator(control: AbstractControl): any {
    const masknum = control.value;
    const num = String(control.value);

    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);

    const number = '(' + num1 + ') ' + num2 + '-' + num3;
    if (control.value == null || control.value == '') {
      return true;
    }
    if (!number) {
      return { invalidPhoneNumber: true };
    }

    if (
      number.match(/(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/g) ||
      masknum.match(/(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/g)
    ) {
      return false;
    }
    return { invalidPhoneNumber: true };
  }

  /**
   * PHONE NUMBER MIN LENGTH
   * @param control
   * @returns
   */

  static phoneMinLength(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const phone = String(control.value).replace(/[^0-9]/g, '');
    if (control.value == null || control.value == '') {
      return null;
    }
    for (const element of Country.countryList()) {
      const dialcode = element.dial_code.replace(/[^0-9]/g, '');
      const phoneNumberRegex = new RegExp(dialcode + '.{10,}$');
      if (phoneNumberRegex.test(phone)) {
        return null;
      }
    }
    return { invalidPhoneLength: true };
  }

  //ZIP VALIDATION
  static zipValidator(control: AbstractControl): any {
    const zip = String(control.value);
    if (control.value == null || control.value == '') {
      return true;
    }
    if (control.value.length < 5 || control.value.length > 10) {
      return { invalidZip: false };
    }

    if (zip.match(/[^A-Za-z\d  -]/)) {
      return { invalidZip: false };
    }
    return true;
  }

  static zipValidatorInternational(control: AbstractControl): any {
    const zip = String(control.value);
    if (control.value == null || control.value == '') {
      return true;
    }
    if (control.value.length < 5 || control.value.length > 10) {
      return { invalidZip: false };
    }

    if (zip.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/)) {
      return { invalidZip: false };
    }
    return true;
  }

  /**
   * A US zip must be 5 digits. Users (and Google address autocomplete) often
   * supply ZIP+4 as "91604-2505", so only the segment before the hyphen is
   * validated. What the user typed is left untouched in the field — use
   * {@link sanitizeZipCode} to get the value that should be sent to the API.
   */
  static zipCodeValidator(control: AbstractControl): ValidationErrors | null {
    const input = String(control.value ?? '').trim();
    if (!input) {
      return null;
    }

    const valueToValidate = input?.split('-')?.[0] ?? '';
    const isValid =
      /^\d+$/.test(valueToValidate) && valueToValidate.length === 5;

    return isValid ? null : { invalidZipLength: true };
  }

  /**
   * Strips the ZIP+4 suffix ("91604-2505" -> "91604") so only the 5 digit zip
   * reaches the API, while the input keeps showing what the user entered.
   */
  static sanitizeZipCode(value: string | null | undefined): string {
    return String(value ?? '').trim()?.split('-')?.[0] ?? '';
  }

  static specialCharValidator(control: AbstractControl): any {
    const inputValue = String(control.value);
    if (control.value == null || control.value == '') {
      return true;
    }

    if (inputValue.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)) {
      return { specialChar: false };
    }
    return true;
  }

  static addressValidator(control: AbstractControl): any {
    if (control.value == null || control.value === '') {
      return null;
    }

    if (String(control.value).match(/[<>"';\\%=+]/)) {
      return { specialChar: false };
    }
    return null;
  }

  static alphabetsAndSpacesValidator(control: AbstractControl): any {
    if (control.value == null || control.value === '') {
      return null;
    }
    if (!/^[a-zA-Z ]+$/.test(control.value)) {
      return { alphabetsAndSpaces: true };
    }
    return null;
  }

  static poBoxValidation(control: AbstractControl): any {
    const address = String(control.value);
    if (control.value == null || control.value == '') {
      return true;
    }

    if (
      address.match(
        /^ *((#\d+)|((box|bin)[-. \/\\]?\d+)|(.*p[ \.]? ?(o|0)[-. \/\\]? *-?((box|bin)|b|(#|n|num|number)?\d+))|(p(ost|ostal)? *(o(ff(ice)?)?)? *((box|bin)|b)? *(#|n|num|number)*\d+)|(p *-?\/?(o)? *-?box)|post office box|((box|bin)|b) *(#|n|num|number)? *\d+|(#|n|num|number) *\d+)/i
      )
    ) {
      return { poBox: true };
    }

    return false;
  }

  static routingNumberValidator(control: AbstractControl): any {
    // Run through each digit and calculate the total.
    let n = 0;
    const rt_number = control.value;

    if (control.value == null || control.value == '') {
      return true;
    }
    for (let i = 0; i < rt_number.length; i += 3) {
      n +=
        parseInt(rt_number.charAt(i), 10) * 3 +
        parseInt(rt_number.charAt(i + 1), 10) * 7 +
        parseInt(rt_number.charAt(i + 2), 10);
    }
    // If the resulting sum is an even multiple of ten (but not zero),
    // the aba routing number is good.

    if (n != 0 && n % 10 == 0) {
      return false;
    }
    return { invalidRoutingNumber: false };
  }

  /**
   * Custom validator for bank account ACH verification.
   *
   * @param {AbstractControl} control - The form control to validate.
   * @returns {ValidationErrors | null} A validation error object if validation fails, or null if validation passes.
   */
  static bankAcACHValidator(control: AbstractControl) {
    const controlVal = control.value as IBankDropdown;
    if (controlVal?.id) {
      if (controlVal.isItZil || controlVal.achApplicationStatus === 1) {
        return null;
      }
      return { achVerificationRequired: true };
    }
    return null;
  }

  //WHITE SPACE ERROR - only when user has entered something that is only whitespace (empty is left to required validator)
  static noWhitespaceValidator(control: AbstractControl): any {
    const value = control.value;
    if (value == null || value === '') return null;
    const isWhitespaceOnly = (value || '').trim().length === 0;
    return isWhitespaceOnly ? { hasWhitespace: true } : null;
  }

  /**
   * @description method to validate no whitespace and pass message as field is required
   */
  static whitespaceValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { required: true };
  }

  public validateDifferentEmail(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const payeeEmail = control.value;
      const senderEmail = this.localStorageService.getItem('email') || '';
      
      if (payeeEmail && senderEmail && payeeEmail.toLowerCase() === senderEmail.toLowerCase()) {
        return { sameEmailAddress: true };
      }
      
      return null;
    };
  }

  //URL VALIDATOR
  static isUrlValid(control: AbstractControl): any {
    const res = control?.value?.match(
      /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
    );

    if (!res && control?.value) return { invalidUrl: true };
    else return false;
  }

  //GET VALIDATION ERRORS
  getValidationError(control: AbstractControl, labelName?: string): any {
    for (const propertyName in control.errors) {
      if (control.errors.hasOwnProperty(propertyName) && control.touched) {
        return ValidationService.getValidationErrorMessage(
          propertyName,
          control.errors[propertyName],
          labelName
        );
      }
    }
    return true;
  }

  // ************************************convert format***********************************************

  // REMOVE WHITE SPACE
  isNullOrWhitespace(input: string): any {
    return !input || !input.trim();
  }

  // FORMATE CURRENCY
  formateCurrency(amount: number): any {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // ALLOW NUMBER ONLY
  public static numberOnly(event: any): any {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  // FORMATE PERCENTAGE
  formateToPercentage(value: number): any {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Date of Birth validator - ensures date is in the past and person is at least 18 years old
   * @param control - The form control to validate
   * @returns ValidationErrors | null
   */
  static dateOfBirthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Check if date is in the future
    if (selectedDate >= today) {
      return { futureDate: true };
    }

    // Check if person is at least 18 years old
    const age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    const dayDiff = today.getDate() - selectedDate.getDate();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (actualAge < 18) {
      return { minAge: true };
    }

    // Check if date is too far in the past (more than 120 years)
    if (actualAge > 120) {
      return { maxAge: true };
    }

    return null;
  }

  static containsHtmlTag(control:AbstractControl){
    if(!control.value) return null;

    const tagPattern = /^[^<>]+$/;

    return tagPattern.test(control.value) ? null :{tagValidation:true};
  }

  /** Characters a name may contain: letters, digits, space, and `. , ' & @ -`. */
  private static readonly nameAllowedChars = /^[\p{L}\p{N} .,'&@-]*$/u;
  /** A name must contain at least one letter, so digits/punctuation alone are rejected. */
  private static readonly nameHasLetter = /\p{L}/u;
  private static readonly nameMaxLength = 100;

  /**
   * @description Shared name check behind `personNameValidator` and `personNamePartValidator`.
   * Each rule reports its own error key so the message can describe the actual problem rather
   * than collapsing "has a `#`", "too short" and "no letters" into one generic string.
   * @param control - The control being validated.
   * @param minLength - Minimum length for the trimmed value.
   * @returns The matching validation error, or null when the name is acceptable.
   */
  private static validateName(
    control: AbstractControl,
    minLength: number
  ): ValidationErrors | null {
    if (control.value == null || control.value === '') {
      return null;
    }

    const value = String(control.value).trim();
    const maxLength = ValidationService.nameMaxLength;

    if (!ValidationService.nameAllowedChars.test(value)) {
      return { invalidNameChars: true };
    }
    if (value.length < minLength) {
      return { invalidNameLength: { minLength } };
    }
    // Reuse the shared `maxLength` message so the too-long case still reads accurately;
    // `invalidNameLength` only ever describes the minimum.
    if (value.length > maxLength) {
      return { maxLength: { requiredLength: maxLength } };
    }
    if (!ValidationService.nameHasLetter.test(value)) {
      return { invalidNameLetter: true };
    }
    return null;
  }

  static personNameValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    return ValidationService.validateName(control, 2);
  }

  static personNamePartValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    return ValidationService.validateName(control, 1);
  }

  /**
   * @description Requires the control value to equal the payee's legal name, ignoring case and
   * surrounding/repeated whitespace. Passes while either side is empty.
   * @param getLegalName - Returns the current payee legal name; read on every validation run.
   */
  static legalNameMatchValidator(
    getLegalName: () => string | null | undefined
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const legalName = String(getLegalName() ?? '').trim();
      return ValidationService.isLegalNameMatch(control.value, legalName)
        ? null
        : { legalNameMismatch: { legalName } };
    };
  }

  static isLegalNameMatch(holderName: unknown, legalName: unknown): boolean {
    const holder = ValidationService.normalizeName(holderName);
    const legal = ValidationService.normalizeName(legalName);
    return !holder || !legal || holder === legal;
  }

  private static normalizeName(value: unknown): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

}
export function AccuntNoValidator(accountNo: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    //proper accountno check
    if (accountNo?.length > 4 && control.value == accountNo) {
      return null;
    }
    //accountno not available
    else if (!accountNo || accountNo.length < 4 || !control.value) {
      return null;
    }
    //accountno with last 4 digits available
    //'xxxx' are removed earlear from accountno
    else if (
      accountNo &&
      accountNo.length == 4 &&
      control.value.length >= 4 &&
      control.value.substr(-4) == accountNo
    ) {
      return null;
    } else {
      return { accountNoMismatch: true };
    }
  };
}

/**
 * Custom validator for required documents in a form control.
 *
 * @param {FormControl<IRequiredDocsValue>} control - The form control to validate.
 * @returns {ValidationErrors | null} A validation error object if validation fails, or null if validation passes.
 */
export function requiredDocumentsValidator(
  control: FormControl<IRequiredDocsValue>
) {
  if (
    (control.value.requiredDocs?.required_docs?.includes('invoice') &&
      !control.value.addedDocs?.invoices) ||
    (control.value.requiredDocs?.required_docs?.includes('card') &&
      (!control.value.addedDocs?.card ||
        !control.value.addedDocs?.cardReverse)) ||
    (control.value.requiredDocs?.required_docs?.includes('authDoc') &&
      (!control.value.addedDocs?.authDoc ||
        !control.value.addedDocs?.certificate))
  )
    return { docsRequired: true };
  return false;
}


/**
 * A payroll check date may be back dated, but only up to `days` days. Both the
 * control value and `minDate` are `YYYY-MM-DD`, so they compare lexically.
 * The error carries the limit so the message can name it.
 *
 * @param minDate - Earliest allowed date, `YYYY-MM-DD`.
 * @param days - How far back `minDate` sits from today.
 */
export function payrollBackDatedLimitValidator(
  minDate: string,
  days: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value || !minDate) {
      return null;
    }
    return value < minDate ? { payrollBackDatedLimit: { days } } : null;
  };
}


 export function confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('password_confirmation')?.value;

  if (password !== confirmPassword) {
    return { confirmPassword: true };
  }
  return null;
}

export function emailOrPhoneRequired():ValidatorFn{
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const email = formGroup.get('payeeEmail')?.value?.trim();
    const phone = formGroup.get('payeePhone')?.value?.trim();

    if (!email && !phone) {
      // Set the same custom error on both fields
      formGroup.get('payeeEmail')?.setErrors({ contactRequired: true });
      formGroup.get('payeePhone')?.setErrors({ contactRequired: true });
    } else {
      // Clear errors if one is filled
      if (formGroup.get('payeeEmail')?.hasError('contactRequired')) {
        formGroup.get('payeeEmail')?.setErrors(null);
      }
      if (formGroup.get('payeePhone')?.hasError('contactRequired')) {
        formGroup.get('payeePhone')?.setErrors(null);
      }
    }

    return null; // We handled errors on child controls
  };
}

export function atLeastOneRequired(fieldNames: string[], errorKey = 'atLeastOneRequired'): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const hasValue = fieldNames.some((name) => !!formGroup.get(name)?.value?.toString().trim());

    fieldNames.forEach((name) => {
      const control = formGroup.get(name);
      if (!hasValue) {
        control?.setErrors({ [errorKey]: true });
      } else if (control?.hasError(errorKey)) {
        control?.setErrors(null);
      }
    });

    return null; // We handled errors on child controls
  };
}