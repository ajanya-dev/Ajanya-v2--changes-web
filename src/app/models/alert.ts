export interface IConfirmAlert {
  /**
   * Title of the alert
   * @default "Confirm"
   */
  title?: string | null;
  /**
   * Subtitle of the alert
   * @default "You won't be able to revert this!"
   */
  content?: string | null;
  /**
   * Confirm message of the alert
   * @default "OK"
   */
  doneMsg?: string;
  /**
   * Cancel message of the alert
   * @default "Cancel"
   */
  cancelMsg?: string;
  /**
   * Automatic close the alert modal
   * @default false
   */
  close?: boolean;
  /**
   * Closes the alert after the given value
   * @default 1000
   */
  timeout?: number;
  /**
   * Show Confirm button of the alert
   * @default true
   */
  isOk?: boolean;
  /**
   * Show Cancel button of the alert
   * @default true
   */
  isCancel?: boolean;

  /**
   * Width of popup
   */
  width?: string;

  /**
   * Customize icon as needed.
   */
  icon?: 'confirm' | 'success' | 'failure' | 'info' | 'warn';
  isShowAsHtml?: boolean;
}

export interface IFailedAlert {
  /**
   * Title of the alert. Pass the FALSE value for disable content.
   * @default "Oops!"
   */
  title?: string | false;
  /**
   * Subtitle of the alert.
   * @default "Something went wrong!"
   */
  content?: string | null;
  /**
   * Confirm message of the alert
   * @default "OK"
   */
  doneMsg?: string;
  /**
   * Cancel message of the alert
   * @default "Cancel"
   */
  cancelMsg?: string;
  /**
   * Automatic close the alert modal
   * @default false
   */
  close?: boolean;
  /**
   * Closes the alert after the given value
   * @default 1000
   */
  timeout?: number;
  /**
   * Show Confirm button of the alert
   * @default true
   */
  isOk?: boolean;
  /**
   * Show Cancel button of the alert
   * @default true
   */
  isCancel?: boolean;
  /**
   * Refresh button to refresh the entire app
   * @default false
   */
  refresh?: boolean;
}

export interface IInfoAlert {
  /**
   * Title of the alert. Pass the FALSE value for disable content.
   * @default "Info"
   */
  title?: string | boolean;
  /**
   * Subtitle of the alert.
   * @default "You won't be able to revert this!"
   */
  content?: string;
  /**
   * Confirm message of the alert
   * @default "OK"
   */
  doneMsg?: string;
  /**
   * Cancel message of the alert
   * @default "Cancel"
   */
  cancelMsg?: string;
  /**
   * Automatic close the alert modal
   * @default false
   */
  close?: boolean;
  /**
   * Closes the alert after the given value
   * @default 1000
   */
  timeout?: number
  /**
   * Show Confirm button of the alert
   * @default true
   */
  isOk?: boolean;
  /**
   * Show Cancel button of the alert
   * @default true
   */
  isCancel?: boolean;
  /**
   * Show input field of the alert
   * @default false
   */
  isInputRequired?: boolean;
  /**
   * Input placeholder of the alert
   */
  inputPlaceholder?: string;
  /**
   * Input default value of the alert
   */
  isShowAsHtml?: boolean;
   /* Input type for validation
   * @default 'email'
   */
  inputType?: 'text' | 'email' | 'number';
}

export interface ISuccessAlert {
  /**
   * Title of the alert. Pass the FALSE value for disable title.
   * @default "Success!"
   */
  title?: string | boolean;
  /**
   * Subtitle of the alert
   * @default "Completed Successfully"
   */
  content?: string;
  /**
   * Confirm message of the alert
   * @default "OK"
   */
  doneMsg?: string;
  /**
   * Cancel message of the alert
   * @default "Cancel"
   */
  cancelMsg?: string;
  /**
   * Automatic close the alert modal
   * @default false
   */
  close?: boolean;
  /**
   * Closes the alert after the given value
   * @default 1000
   */
  timeout?: number;
  /**
   * Show Confirm button of the alert
   * @default true
   */
  isOk?: boolean;
  /**
   * Show Cancel button of the alert
   * @default true
   */
  isCancel?: boolean;
}

export interface IWarningAlert {
  /**
   * Title of the alert. Pass the FALSE value for disable content.
   * @default "Oops!"
   */
  title?: string | boolean;
  /**
   * Subtitle of the alert.
   * @default "Error During Work."
   */
  content?: string;
  /**
   * Confirm message of the alert
   * @default "OK"
   */
  doneMsg?: string;
  /**
   * Cancel message of the alert
   * @default "Cancel"
   */
  cancelMsg?: string;
  /**
   * Automatic close the alert modal
   * @default false
   */
  close?: boolean;
  /**
   * Closes the alert after the given value
   * @default 1000
   */
  timeout?: number;
  /**
   * Show Confirm button of the alert
   * @default true
   */
  isOk?: boolean;
  /**
   * Show Cancel button of the alert
   * @default true
   */
  isCancel?: boolean;
}

export interface IAlertErrorMsgData {
  error_type: string;
  errorMsg: string;
  title: string;
}
