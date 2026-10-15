import { Injectable } from '@angular/core';

/**
 * @description A single source/transfer-type combination and the columns an
 * imported Excel file must contain for it.
 */
export interface ImportFileMethodFields {
  key: string;
  sourceType: string;
  transferType: string;
  sourceLabel: string;
  transferLabel: string;
  fields: string[];
  fieldLabels: string[];
  minColumns: number;
}

/**
 * @description Import field requirements grouped by the payment source.
 */
export interface ImportFileFieldGroup {
  sourceType: string;
  sourceLabel: string;
  methods: ImportFileMethodFields[];
}

/**
 * Static field requirements keyed by `<sourceType>-<transferType>`.
 * Mirrors the `fields` object returned by the import-payments API.
 */
export const IMPORT_FILE_FIELDS: Record<string, string[]> = {
  'wallet-letVendorDecide': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'payee_email'
  ],
  'wallet-ach': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'routing_number',
    'account_number'
  ],
  'wallet-wire': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'routing_number',
    'account_number'
  ],
  'wallet-virtualCard': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'payee_email'
  ],
  'wallet-checkMail': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'payee_address_line_1',
    'payee_city',
    'payee_state',
    'payee_zip',
    'payee_country'
  ],
  'wallet-checkEmail': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'payee_email'
  ],
  'wallet-checkPrint': ['source_type', 'transfer_type', 'payee_name', 'amount'],
  'bankaccount-ach': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'routing_number',
    'account_number'
  ],
  'bankaccount-check': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'check_issue_date',
    'check_serial_number'
  ],
  'card-ach': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'routing_number',
    'account_number'
  ],
  'card-wire': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'routing_number',
    'account_number'
  ],
  'card-checkMail': [
    'source_type',
    'transfer_type',
    'payee_name',
    'amount',
    'payee_address_line_1',
    'payee_city',
    'payee_state',
    'payee_zip',
    'payee_country'
  ]
};

const SOURCE_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  bankaccount: 'Bank Account',
  card: 'Credit Card'
};

const TRANSFER_LABELS: Record<string, string> = {
  ach: 'ACH',
  wire: 'Wire',
  virtualCard: 'Virtual Card',
  checkMail: 'Mail Check',
  checkEmail: 'Email Check',
  checkPrint: 'Print Check',
  check: 'Check',
  letVendorDecide: 'Let Vendor Decide'
};

const FIELD_LABELS: Record<string, string> = {
  source_type: 'pay from',
  transfer_type: 'pay as',
  payee_name: 'payee name',
  amount: 'amount',
  routing_number: 'routing number',
  account_number: 'account number',
  payee_email: 'payee email',
  payee_address_line_1: 'address line 1',
  payee_city: 'city',
  payee_state: 'state',
  payee_zip: 'zip',
  payee_country: 'country',
  check_issue_date: 'check issue date',
  check_serial_number: 'check number'
};

/**
 * @description Serves the static reference data used by the bulk payment
 * import flow, such as the required columns for each payment method.
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  /**
   * @description Builds the "How to prepare your file" guide from the static
   * field map, grouped by payment source and ordered as the map declares them.
   * @param fields Optional field map (defaults to the bundled static data).
   * @returns Import field requirements grouped by payment source.
   */
  getImportFileFieldGroups(
    fields: Record<string, string[]> = IMPORT_FILE_FIELDS
  ): ImportFileFieldGroup[] {
    const groups: ImportFileFieldGroup[] = [];

    Object.entries(fields).forEach(([key, fieldNames]) => {
      const [sourceType, transferType] = key.split('-');
      let group = groups.find((el) => el.sourceType === sourceType);

      if (!group) {
        group = {
          sourceType,
          sourceLabel: SOURCE_LABELS[sourceType] ?? this.humanize(sourceType),
          methods: []
        };
        groups.push(group);
      }

      group.methods.push({
        key,
        sourceType,
        transferType,
        sourceLabel: group.sourceLabel,
        transferLabel:
          TRANSFER_LABELS[transferType] ?? this.humanize(transferType),
        fields: fieldNames,
        fieldLabels: fieldNames.map(
          (field) => FIELD_LABELS[field] ?? this.humanize(field).toLowerCase()
        ),
        minColumns: fieldNames.length
      });
    });

    return groups;
  }

  /**
   * @description Converts a snake_case or camelCase key to spaced words.
   * @param value Raw key to convert.
   * @returns Human readable text.
   */
  private humanize(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .trim();
  }
}
