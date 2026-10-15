import { FormControl } from '@angular/forms';

export interface INetSuiteForm {
  accountId: FormControl<string | null>;
  consumerKey: FormControl<string | null>;
  secret: FormControl<string | null>;
  token: FormControl<string | null>;
  tokenSecret: FormControl<string | null>;
}

export interface INetsuiteConnectionPayload {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
}

export interface INetSuiteOAuthForm {
  accountId: FormControl<string | null>;
  clientId: FormControl<string | null>;
  clientSecret: FormControl<string | null>;
}

export interface INetsuiteOAuthConnectPayload {
  accountId: string;
  clientId: string;
  clientSecret: string;
}

export interface INetsuiteOAuthConnectData {
  url: string;
  authMethod: number;
}

/**
 * Companies on these plugins are still provisioned for NetSuite token-based
 * authentication (TBA) and must keep the pre-OAuth connect flow.
 */
export const NETSUITE_LEGACY_TBA_PLUGINS = [
  'enterprise-wiygul',
  'enterprise-maf',
  'enterprise-compass'
];

/**
 * @description Decides whether the NetSuite connect modal should render the
 * legacy TBA flow instead of the OAuth flow.
 * @param enabledPlugins - `enabledPlugins` from the header data.
 * @returns True when the company is on a legacy TBA plugin.
 */
export function isNetsuiteLegacyTbaCustomer(
  enabledPlugins?: string[]
): boolean {
  return NETSUITE_LEGACY_TBA_PLUGINS.some(
    (plugin) => enabledPlugins?.includes(plugin) ?? false
  );
}

/**
 * Union of both flows' controls. Only the active flow's controls are enabled,
 * so the inactive branch never takes part in validation.
 */
export interface INetSuiteConnectForm
  extends INetSuiteForm,
    INetSuiteOAuthForm {}

export interface INetsuiteMapedBankList {
  id: string;
  netsuiteId: number;
  netsuiteAccount: string;
  ocwBankAccount: string;
  ocwBankAccountId: string;
  ocwSubsidiaryId: string;
  ocwBankAccountNickName: string;
  isMapped: number;
}

export interface INetsuiteSettings {
  defaultSubsidiaryId: string;
  defaultSubsidiaryName: string;
  pushBackEnable: number;
  downloadFilter: number;
  check: number;
  allowExport: boolean;
  customField: string;
}

export interface INetSuitePushBack {
  isNetsuiteConnected: number;
  isPushBackEnabled: number;
  isPushBackEnabledInSua: boolean;
}

export interface INetSuiteBank {
  netsuiteBankName: string;
  netsuiteBankId: string;
  netsuiteLocationId: string;
  netsuiteLocationName: string;
}

export interface INetSuiteExportsForm {
  expense: FormControl<INetSuiteClass | null>;
  description: FormControl<string | undefined>;
  customer: FormControl<INetSuiteClass | null>;
  class: FormControl<INetSuiteClass | null>;
  amount: FormControl<string | undefined>;
}

export interface INetSuiteClass {
  id: string;
  name: string;
}

export interface INetSuiteExportsData {
  netSuiteBankId: string;
  formValue: INetSuiteExportsFormBody[];
  netSuiteTotal: number;
  locationId?: string;
}

export interface INetSuiteExportsFormBody {
  expenseId?: string;
  description?: string;
  customerId?: string;
  classId?: string;
  locationId?: string;
  amount?: string;
}
