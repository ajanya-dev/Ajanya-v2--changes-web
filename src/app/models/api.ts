export interface IApiResSuccessOnly {
  readonly success: boolean;
  readonly errorMsg?: string;
}

export interface IApiRes<Type> {
  readonly success: boolean;
  readonly data: Type;
  readonly totalCount?: number;
}

export interface IApiMailCheckRes<Type> {
  readonly success: boolean;
  readonly data: Type;
  readonly errorCode?: number;
  readonly batch_id?: string;
}

export interface IApiMailCheckResMessage {
  readonly success: boolean;
  readonly message: string;
  readonly check_ids?: string[];
}

export interface IApiResMesssage {
  readonly success: boolean;
  readonly message: string;
}

export interface IApiResMesssageWithPayments extends IApiResMesssage {
  readonly zilPaymentIds: string[];
}

export interface IApiResWithMsg<Type> {
  readonly success: boolean;
  readonly message: string;
  readonly data: Type;
}

export interface IApiResWithUrl {
  readonly success: boolean;
  readonly url: string;
}

/**
 *
 * Excludes the undefined and null  types from fields of a form value.
 *
 *  Usage:-
 *    Assume that `someForm` is a `FormGroup`.
 *
 *    `const formValue = someForm.value as NonNullableFormValue<typeof [someForm].value>`
 *       or
 *    `const formValue = <NonNullableFormValue<typeof [someForm].value>>someForm.value`
 *
 *  so if `someform` has a field named `name`, then the type of `formValue` will be as follows:-
 *
 *  `{ name: string }` instead of `{ name: string | undefined | null }`
 */
export type NonNullableFormValue<T extends Record<string, any>> = {
  [key in keyof Required<T>]: NonNullable<T[key]>;
};
