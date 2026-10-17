import { IPayeeBank, IPayeeInterBank } from '../../../payee-v2/model/payee';
import {
  countPayeeAccounts,
  countryName,
  filterPayeeAccounts,
  mergePayeeAccounts
} from './payee-accounts.util';

function domestic(overrides: Partial<IPayeeBank>): IPayeeBank {
  return {
    id: 'd',
    bank_name: 'Bank',
    routing_number: '021000021',
    account_number: '000111224421',
    account_type: 'personalChecking',
    is_default_for_check_draft: 0,
    is_default_for_direct_deposit: 0,
    is_allow_wire: 0,
    bank_account_first_name: 'Ada',
    bank_account_last_name: 'Lovelace',
    bank_account_address1: '',
    bank_account_city: '',
    bank_account_state: '',
    bank_account_zip: '',
    bank_account_country: 'US',
    banking_institute_name: '',
    banking_institute_address_line1: '',
    banking_institute_address_line2: '',
    banking_institute_city: '',
    banking_institute_state: '',
    banking_institute_zip: '',
    banking_institute_country: '',
    ...overrides
  };
}

function international(overrides: Partial<IPayeeInterBank>): IPayeeInterBank {
  return {
    id: 'i',
    payee_name: 'Payee',
    bank_name: 'HSBC UK',
    routing_number: '',
    account_number: 'GB29NWBK60161331929921',
    swift_or_bic: 'HBUKGB4B',
    bank_identifier_type: 'SWIFT',
    account_type: 'business',
    payment_purpose: '',
    created_at: '',
    updated_at: '',
    currency: 'GBP',
    kyc_location: '',
    account_name: 'Acme Ltd',
    bank_account_details: { beneficiary_bank_country: 'GB' },
    ...overrides
  } as IPayeeInterBank;
}

describe('mergePayeeAccounts', () => {
  it('tags every row with its kind and keeps both lists', () => {
    const rows = mergePayeeAccounts(
      [domestic({ id: 'd1' })],
      [international({ id: 'i1' })]
    );
    expect(rows.map((r) => [r.kind, r.id])).toEqual([
      ['domestic', 'd1'],
      ['international', 'i1']
    ]);
  });

  it('puts default accounts first, then sorts by bank name A to Z', () => {
    const rows = mergePayeeAccounts(
      [
        domestic({ id: 'd1', bank_name: 'Wells Fargo' }),
        domestic({ id: 'd2', bank_name: 'chase', is_default_for_direct_deposit: 1 })
      ],
      [
        international({ id: 'i1', bank_name: 'Barclays' }),
        international({ id: 'i2', bank_name: 'Deutsche Bank', is_default_for_business: 1 })
      ]
    );
    expect(rows.map((r) => r.id)).toEqual(['d2', 'i2', 'i1', 'd1']);
  });

  it('marks a domestic row default only for direct deposit', () => {
    const [byCheck, byDd] = mergePayeeAccounts(
      [
        domestic({ id: 'a', is_default_for_check_draft: 1 }),
        domestic({ id: 'b', is_default_for_direct_deposit: 1 })
      ],
      []
    ).sort((x, y) => x.id.localeCompare(y.id));
    expect(byCheck.isDefault).toBeFalse();
    expect(byDd.isDefault).toBeTrue();
  });

  it('marks an international row default for business or personal', () => {
    const rows = mergePayeeAccounts(
      [],
      [
        international({ id: 'a', is_default_for_personal: 1, account_type: 'personal' }),
        international({ id: 'b', is_default_for_business: 1 }),
        international({ id: 'c' })
      ]
    ).sort((x, y) => x.id.localeCompare(y.id));
    expect(rows.map((r) => r.isDefault)).toEqual([true, true, false]);
  });

  it('describes a domestic row with holder, type, masked number and routing', () => {
    const [row] = mergePayeeAccounts(
      [domestic({ account_type: 'businessSavings', account_number: '99887766' })],
      []
    );
    expect(row.bankName).toBe('Bank');
    expect(row.holderName).toBe('Ada Lovelace');
    expect(row.accountLabel).toBe('Business Savings');
    expect(row.maskedNumber).toBe('••••7766');
    expect(row.identifier).toBe('021000021');
    expect(row.countryCode).toBe('');
  });

  it('describes an international row with currency, masked number, SWIFT and country', () => {
    const [row] = mergePayeeAccounts([], [international({})]);
    expect(row.bankName).toBe('HSBC UK');
    expect(row.holderName).toBe('Acme Ltd');
    expect(row.accountLabel).toBe('GBP · Business');
    expect(row.maskedNumber).toBe('••••9921');
    expect(row.identifier).toBe('HBUKGB4B');
    expect(row.countryCode).toBe('GB');
  });

  it('falls back to account name, then payee name, when an international bank has no name', () => {
    const rows = mergePayeeAccounts(
      [],
      [
        international({ id: 'a', bank_name: '', account_name: 'Acme Ltd' }),
        international({ id: 'b', bank_name: '', account_name: '', payee_name: 'Payee' })
      ]
    ).sort((x, y) => x.id.localeCompare(y.id));
    expect(rows.map((r) => r.bankName)).toEqual(['Acme Ltd', 'Payee']);
  });

  it('masks short account numbers as a dash', () => {
    const [row] = mergePayeeAccounts([domestic({ account_number: '' })], []);
    expect(row.maskedNumber).toBe('—');
  });
});

describe('filterPayeeAccounts', () => {
  const rows = mergePayeeAccounts(
    [domestic({ id: 'd1' }), domestic({ id: 'd2', bank_name: 'Zeta' })],
    [international({ id: 'i1' })]
  );

  it('returns everything for all', () => {
    expect(filterPayeeAccounts(rows, 'all')).toHaveSize(3);
  });

  it('returns only domestic rows for domestic', () => {
    expect(filterPayeeAccounts(rows, 'domestic').map((r) => r.id)).toEqual(['d1', 'd2']);
  });

  it('returns only international rows for international', () => {
    expect(filterPayeeAccounts(rows, 'international').map((r) => r.id)).toEqual(['i1']);
  });
});

describe('countPayeeAccounts', () => {
  it('counts all, domestic and international', () => {
    const rows = mergePayeeAccounts(
      [domestic({ id: 'd1' }), domestic({ id: 'd2' })],
      [international({ id: 'i1' })]
    );
    expect(countPayeeAccounts(rows)).toEqual({ all: 3, domestic: 2, international: 1 });
  });
});

describe('countryName', () => {
  it('resolves an ISO code to the country name', () => {
    expect(countryName('GB')).toBe('United Kingdom');
  });

  it('returns a dash for an empty code and the code itself when unknown', () => {
    expect(countryName('')).toBe('-');
    expect(countryName('ZZ')).toBe('ZZ');
  });
});
