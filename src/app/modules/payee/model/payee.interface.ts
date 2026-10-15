/**
 * Represents a connected application in a list of payees.
 * @interface
 */
export interface IPayeeListsConnectedApps {
  /**
   * The unique identifier of the connected application.
   * @type {string}
   */
  appId: string;

  /**
   * The name of the connected application.
   * @type {string}
   */
  name: string;

  /**
   * The URL to the logo of the connected application.
   * @type {string}
   */
  logo: string;

  /**
   * The loading status of the connected application.
   * @type {number} - Possible values: 0 (none), 1 (importing), 2 (disconnecting)
   */
  loading?: 0 | 1 | 2;
}

export interface IPayeeSummary {
  check_account_number: string;
  last_catagory_id: string;
  total_paid: string;
  total_paid_in_month: string;
  total_paid_in_year: string;
  total_paid_in_last_year?: string;
}