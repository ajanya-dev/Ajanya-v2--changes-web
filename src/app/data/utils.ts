import { HttpHeaders } from '@angular/common/http';
import {
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn
} from '@angular/forms';
import { from, Observable, Subscription } from 'rxjs';

export class Utils {
  static subscriptions: Subscription[] = [];

  static getCookie(cname: string) {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

  static setCookie(name: string, value: number | string, days?: number) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  /** Get all Cookies */
  static getAllCookies(): any {
    const allCookies: any = {};
    for (const c of document.cookie.split(';')) {
      allCookies[c.split('=')[0]?.trim()] = c.split('=')[1];
    }
    return allCookies;
  }

  /** Hash a string */
  static async getHash(string: string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    });
  }

  /** Create Secured sign */
  static createAuthSign(string: any): Observable<string> {
    return from(this.getHash('ocw' + JSON.stringify(string) + 'ocw'));
  }

  /** HTTP HEADERS */
  static httpHeaders(values: { [key: string]: any }): any {
    return { headers: new HttpHeaders(values) };
  }

  static numberOnly(
    event: any,
    type: 'numeric' | 'decimal' = 'numeric',
    allowNegative?: boolean,
    inputElement?: HTMLInputElement
  ): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    const target = inputElement || (event.target as HTMLInputElement);

    if (target && type === 'decimal') {
      this.addZeroPrefix(charCode, target);
    }

    // Prevent multiple decimal points
    if (charCode === 46 && type === 'decimal') {
      if (target && target.value && target.value.includes('.')) {
        return false;
      }
      return true;
    }

    if (charCode === 45 && allowNegative) {
      return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /** Add Zero Prefix when enter zero as initial value */
  private static addZeroPrefix(
    charCode: number,
    inputElement: HTMLInputElement
  ) {
    if (charCode === 46 && inputElement.value === '') {
      inputElement.value = '';
      inputElement.value = '0.';
    }
  }

  static prevantSpecialChar(event: any, allowed?: ['negative', 'no_space']) {
    const k = event.charCode;
    if (allowed?.includes('no_space')) {
      if (
        (k >= 48 && k <= 57) ||
        (k >= 65 && k <= 90) ||
        (k >= 97 && k <= 122)
      ) {
        return true;
      } else {
        return false;
      }
    }
    if (allowed?.includes('negative') && !event.target.value.includes('-')) {
      return (
        k == 45 ||
        (k > 64 && k < 91) ||
        (k > 96 && k < 123) ||
        k == 8 ||
        k == 32 ||
        (k >= 48 && k <= 57)
      );
    }
    return (
      (k > 64 && k < 91) ||
      (k > 96 && k < 123) ||
      k == 8 ||
      k == 32 ||
      (k >= 48 && k <= 57)
    );
  }

  // Sanitizes pasted text to only letters, digits and spaces — mirrors the
  // default (no `allowed`) character set permitted by prevantSpecialChar,
  // so paste can't be used to bypass the keypress restriction.
  static preventInvalidPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const sanitized = pasted.replace(/[^a-zA-Z0-9 ]/g, '');
    if (sanitized) {
      document.execCommand('insertText', false, sanitized);
    }
  }

  static removeSpecialChar(ev: any) {
    const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

    if (format.test(ev.target.value)) {
      const data = ev.target.value.replace(/[^a-zA-Z ][^0-9]/g, '');

      return data;
    }
  }

  // upload file maximum size validation
  static maxSizeValidator(size: number): boolean {
    const divider = 1e6;
    if (size / divider > 5) {
      return true;
    }
    return false;
  }

  /**
   * Validates a filetype of a file with give file types.
   * returns `true` if type of the file not includes in filetypes passed as parameter.
   * else returns `false`
   * @param file - file that should be validated
   * @param fileTypes - file types that should not be the type of the file
   * @returns
   */
  static fileTypeValidator(file: File, fileTypes: string[]): boolean {
    const filename = file.name;
    const extName = filename.split('.')[filename.split('.').length - 1];

    if (fileTypes.includes(extName)) return false;

    return true;
  }

  /** Know the form control having the required validator even if its valid. */
  static isRequiredControl = (
    formGroup: UntypedFormGroup,
    controlName: string
  ): boolean => {
    const { controls } = formGroup;
    const control = controls[controlName];
    const { validator } = control;
    if (validator) {
      const validation = validator(new UntypedFormControl());
      return validation !== null && validation.required === true;
    }
    return false;
  };

  static showRecaptcheBadge(isShow = true): void {
    const recaptchaBadge = <HTMLElement>(
      document.getElementsByClassName('grecaptcha-badge')[0]
    );
    if (recaptchaBadge) {
      if (isShow) recaptchaBadge.style.visibility = 'visible';
      else recaptchaBadge.style.visibility = 'hidden';
    }
  }

  static deepCopy<T>(source: T): T {
    return Array.isArray(source)
      ? source.map((item) => this.deepCopy(item))
      : source instanceof Date
        ? new Date(source.getTime())
        : source && typeof source === 'object'
          ? Object.getOwnPropertyNames(source).reduce(
              (o, prop) => {
                Object.defineProperty(
                  o,
                  prop,
                  Object.getOwnPropertyDescriptor(source, prop)!
                );
                o[prop] = this.deepCopy(
                  (source as { [key: string]: any })[prop]
                );
                return o;
              },
              Object.create(Object.getPrototypeOf(source))
            )
          : (source as T);
  }

  static getMaskedAcNo(acNo: string) {
    if (acNo && acNo.length >= 4) {
      return '*****' + acNo.slice(-4);
    }
    return acNo;
  }

  static getMaskedAcNo2(acNo: string) {
    if (acNo && acNo.length > 4) {
      return '*'.repeat(acNo.length - 4) + acNo.slice(-4);
    }
    return acNo;
  }

  static camelToSnake(obj: { [key: string]: unknown }) {
    const newObj: { [key: string]: unknown } = {};
    for (const key in obj) {
      const newKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      newObj[newKey] = obj[key];
    }
    return newObj;
  }

  /** A bare calendar date, already in the shape the payment APIs expect. */
  private static readonly YMD = /^\d{4}-\d{2}-\d{2}$/;

  /** The same date, but tolerating unpadded month/day (e.g. "2026-9-4"). */
  private static readonly DATE_ONLY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

  /**
   * Formats a date value as the `YYYY-MM-DD` string the payment APIs expect,
   * reading it in the browser's own timezone.
   *
   * `new Date('2026-09-14')` is specified to parse as UTC midnight, so reading
   * it back with the local getters lands on the previous day everywhere west of
   * Greenwich — every US and Canadian customer saw an issue date one day
   * behind. A value that is already a bare `YYYY-MM-DD` is therefore returned
   * untouched, and any other date-only string is pinned to local midnight
   * before it is formatted.
   *
   * @param value Date object, or a date string from a picker or the backend
   * @returns The local calendar date, or `null` if there isn't a usable one
   */
  static toLocalYmd(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string' && Utils.YMD.test(value)) {
      return value;
    }

    const dateOnly =
      typeof value === 'string' ? Utils.DATE_ONLY.exec(value) : null;

    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      return Utils.formatLocalYmd(
        new Date(Number(year), Number(month) - 1, Number(day))
      );
    }

    const d = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(d.getTime())) {
      return null;
    }

    return Utils.formatLocalYmd(d);
  }

  /** Reads a Date's calendar day in the browser's own timezone, never UTC. */
  private static formatLocalYmd(date: Date): string {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  /** Backend joins date and time with "-", "_", or " " (e.g. "08/26/2026_09:42 am"). */
  private static readonly DATE_TIME_SEPARATOR = /[-_ ]/;

  /**
   * Splits a combined date-time string from the backend into its date and time parts.
   * Supports "-", "_", and " " as the separator. Only the first occurrence is used as
   * the split point, so a space inside the time part (e.g. "09:42 am") is preserved.
   * @param dateTime Date and time in a single string
   * @returns `[date, time]` (either may be undefined)
   */
  static splitDateTime(dateTime: string): [string?, string?] {
    if (!dateTime) {
      return [];
    }
    const match = dateTime.match(Utils.DATE_TIME_SEPARATOR);
    if (!match || match.index === undefined) {
      return [dateTime.trim()];
    }
    const date = dateTime.slice(0, match.index);
    const time = dateTime.slice(match.index + match[0].length);
    return [date?.trim(), time?.trim()];
  }

  /**
   * The backend returns `updated_at` as a pre-formatted CST string:
   * "MM/DD/YYYY-HH:MM am/pm". `new Date()` cannot parse this accurately across
   * timezones, so we reconstruct a proper UTC ISO string by applying the CST
   * offset (UTC-6). Used by the v4 transaction grids to feed the
   * "Last Transaction" tile.
   * @param updatedAt Combined CST date-time string from the backend
   * @returns UTC ISO string, or undefined when the input is missing/unparseable
   */
  static parseCstDateToIso(updatedAt: string | undefined): string | undefined {
    if (!updatedAt) return undefined;
    const [datePart, timePart] = Utils.splitDateTime(updatedAt);
    if (!datePart || !timePart) return undefined;
    const [month, day, year] = datePart.split('/').map(Number);
    const timeMatch = timePart.match(/^(\d+):(\d+)\s*(am|pm)$/i);
    if (!timeMatch || !month || !day || !year) return undefined;
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3].toLowerCase();
    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    // CST is UTC-6; convert to UTC by adding 6 hours
    return new Date(Date.UTC(year, month - 1, day, hours + 6, minutes)).toISOString();
  }

  /**
   * if we are getting the date and time as one string from backend so we need to split it.
   * @param dateTime Date and time in a single string
   * @returns Only the date
   */
  static splitDate(dateTime: string) {
    return Utils.splitDateTime(dateTime)[0];
  }

  /**
   * if we are getting the date and time as one string from backend so we need to split it.
   * @param dateTime Date and time in a single string
   * @returns Only the time
   */
  static splitTime(dateTime: string) {
    return Utils.splitDateTime(dateTime)[1];
  }

  /**
   * Compares two objects for deep equality, including nested objects and date properties.
   * @param {any} obj1 - The first object to compare.
   * @param {any} obj2 - The second object to compare.
   * @returns {boolean} True if the objects are equal; otherwise, false.
   */
  static areObjectsEqual(obj1: any, obj2: any): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }
    try {
      for (const key of keys1) {
        if (!obj1 || !obj2) {
          return false;
        }
        if (
          typeof obj1[key] === 'object' &&
          typeof obj2[key] === 'object' &&
          obj2[key] !== null &&
          obj1[key] !== null
        ) {
          if (!this.areObjectsEqual(obj1[key], obj2[key])) {
            return false;
          }
        } else if (key == 'date') {
          const date1 = new Date(obj1[key]).toDateString();
          const date2 = new Date(obj2[key]).toDateString();
          if (date1 != date2) {
            return false;
          }
        } else if (obj1[key] != obj2[key]) {
          return false;
        }
      }
    } catch (error) {
      return false;
    }

    return true;
  }

  /**
   * Sets control validators for the specified form controls in a FormGroup.
   * @param {FormGroup} formGroup - The FormGroup instance.
   * @param {Object} validatorMap - A map of control names and corresponding validators.
   */
  static setControlValidatorsToFormGroup(
    formGroup: FormGroup,
    validatorMap: { [controlName: string]: ValidatorFn | ValidatorFn[] }
  ): void {
    for (const controlName in validatorMap) {
      if (formGroup.get(controlName)) {
        const validators = validatorMap[controlName];
        formGroup.get(controlName)?.clearValidators();
        formGroup.get(controlName)?.addValidators(validators);
        formGroup.get(controlName)?.updateValueAndValidity();
      }
    }
  }

  /**
   * Converts an amount value to a numeric format.
   * @param {string | number | undefined | null} amount - The amount to be converted.
   * @returns {number} The numeric representation of the amount, or 0.00 if the input is invalid.
   */
  static amountToNumber(amount: string | number | undefined | null) {
    if (!amount || amount == '') {
      return 0.0;
    }
    if (typeof amount === 'string') {
      return Number(amount?.replace(/,/g, ''));
    }
    if (typeof amount === 'number') {
      return amount;
    }
    return 0.0;
  }

  static capitalize(text: string) {
    const words = text.trim().split(' ');
    const capitalizedText = words
      .map((t) => {
        return t.charAt(0).toUpperCase() + t.slice(1);
      })
      .join(' ');
    return capitalizedText;
  }

  /**
   * Determines if the current device is a mobile device.
   * @returns True if the current device is a mobile device, false otherwise.
   */
  static getDeviceType(): string {
    if (typeof window === 'undefined' || !navigator) {
      return 'unknown';
    }
    const userAgent = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
      return 'tablet';
    }
    if (window.screen.width > 1024) {
      return 'desktop';
    }
    if (window.screen.width > 768) {
      return 'tablet';
    }
    return 'phone';
  }

  static getUtmParam(param: string): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(param);
    if (urlValue) return urlValue;

    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const [key, value] = cookies[i].trim().split('=');
      if (key === param) {
        return decodeURIComponent(value);
      }
    }
    return undefined;
  }

  static isMobile(): boolean {
    let check = false;
    (function (a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          a
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
          a.substr(0, 4)
        )
      )
        check = true;
    })(navigator.userAgent || navigator.vendor);
    return check;
  }
}
