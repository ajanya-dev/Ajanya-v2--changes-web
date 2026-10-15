/**
 * A single QuickBooks Payroll pay run, as returned live from Intuit by the
 * fetch-payrolls endpoint.
 */
export interface IQuickbooksPayrollRun {
  /**
   * Pay run id sent as `payrollId` when creating checks.
   */
  payrollId: string;
  /**
   * Intuit realmId of the company the pay run belongs to.
   */
  companyId: string;
  companyName: string;
  payPeriodFrom: string;
  payPeriodTo: string;
  processedDate: string;
  checkDate: string;
  grossPay: number;
  /**
   * Employee take-home total. Informational only; check amounts are derived
   * per employee by the backend.
   */
  netPay: number;
  employeeCount: number;
  /**
   * 1 once checks have been created for the pay run. Re-running Create is
   * harmless because of the per-employee duplicate protection, so the button
   * is disabled rather than removed.
   */
  isImported: number;
}

/**
 * Response of the QuickBooks Payroll fetch-payrolls endpoint. `data` carries
 * the pay runs, `errorMsg` the failure text.
 */
export interface IQuickbooksPayrollFetchRes {
  success: boolean;
  data?: IQuickbooksPayrollRun[];
  errorMsg?: string;
}

/**
 * Response of the QuickBooks Payroll import-transactions endpoint.
 * `check` is the number of newly created checks; already created employee
 * checks are skipped by duplicate protection, so re-running a pay run returns
 * 0 without creating anything twice.
 */
export interface IQuickbooksPayrollImportRes {
  success: boolean;
  check?: number;
  errorMsg?: string;
}
