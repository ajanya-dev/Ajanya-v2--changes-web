export class CloudBank {
  static bankDetails(): any {
    return [
      {
        selectedValue: 'value1',
        accountName: 'My Business',
        accountNumber: 545454545454,
        availBalance: '$1,000.00',
        type: 'BusinessChecking',
        checked: true,
        active: true
      },
      {
        selectedValue: 'value2',
        accountName: 'My old values',
        accountNumber: 545454545454,
        availBalance: '$2,000.00',
        type: 'customerChecking',
        checked: false,
        active: false
      },
      {
        selectedValue: 'value3',
        accountName: 'My Business',
        accountNumber: 545454545454,
        availBalance: '$1,000.00',
        type: 'BusinessChecking',
        checked: false,
        active: false
      },
      {
        selectedValue: 'value4',
        accountName: 'My old values',
        accountNumber: 545454545454,
        availBalance: '$2,000.00',
        type: 'customerChecking',
        checked: false,
        active: false
      }
    ];
  }

  static cardDetails() {
    return [
      {
        selectedValue: 'value1',
        label: 'My Business Card',
        last4Digits: '4532',
        cardType: 'Physical',
        status: 'Pending',
        checked: true,
        active: true
      },
      {
        selectedValue: 'value2',
        label: 'My Businesss Card',
        last4Digits: '6594',
        cardType: 'Virtual',
        status: 'Active',
        checked: false,
        active: false
      },
      {
        selectedValue: 'value3',
        label: 'Company Card',
        last4Digits: '8745',
        cardType: 'Physical',
        status: 'Pending',
        checked: false,
        active: false
      },
      {
        selectedValue: 'value4',
        label: 'Corporate Business',
        last4Digits: '9454',
        cardType: 'Virtual',
        status: 'Active',
        checked: false,
        active: false
      }
    ];
  }

  static actionList() {
    return [
      {
        title: 'Card',
        icon: 'fa-solid fa-credit-card'
      },
      {
        title: 'Statement',
        icon: 'fa-solid fa-memo'
      },
      {
        title: 'Add Fund',
        icon: 'fa-solid fa-money-check-dollar'
      },
      {
        title: 'Refresh Transaction',
        icon: 'fa-solid fa-arrows-rotate'
      },
      {
        title: 'Edit Nick Name',
        icon: 'fa-solid fa-pen'
      }
    ];
  }

  static cellrendererBtn() {
    return {
      action: [
        {
          name: 'Add Comment',
          id: 'RId_comment',
          icon: 'fa-solid fa-comments'
        },
        {
          name: 'Add Attachment',
          id: 'RId_atachment',
          icon: 'fa-solid fa-paperclip'
        },
        {
          name: 'Download PDF',
          id: 'dwnld_pdf',
          icon: 'fa fa-download'
        },
        {
          name: 'Send Email',
          id: 'RId_email',
          icon: 'fa-solid fa-envelope'
        }
      ]
    };
  }

  static sentPaymentList() {
    return [
      'Internal Transfer',
      'ACH',
      'Check',
      'Wire (Domestic/International)',
      'Gift Card',
      'To Another Debit Card (Instant)'
    ] as const;
  }

  static receivePaymentList() {
    return ['Pull from Debit Card', 'Check Deposit'] as const;
  }

  static downloadList() {
    // return ['Statement', 'Verification Form']
    return ['Statement'];
  }

  static domasticWireFields(): string[] {
    return [
      'From Bank AC',
      'Amount',
      'Description',
      'Payee Name',
      'Payee Nick Name',
      'Payee Email',
      'Payee Phone',
      'Payee Routing Number',
      'Payee Bank Ac',
      'Payee Account Type',
      'Payee Addr Line #1',
      'Payee Addr Line #2',
      'Payee City',
      'Payee State',
      'Payee Zip',
      'On Behalf of'
    ];
  }

  static giftCardFields(): string[] {
    return [
      'From Bank AC',
      'Amount',
      'Description',
      'Payee Name',
      'Payee Nick Name',
      'Payee Email',
      'Payee Phone',
      'Payee Addr Line #1',
      'Payee Addr Line #2',
      'Payee City',
      'Payee State',
      'Payee Zip',
      'On Behalf of',
      'Card Nick Name'
    ];
  }

  static achFieds(): string[] {
    return [
      'From Bank AC',
      'Amount',
      'Description',
      'Payee Name',
      'Payee Nick Name',
      'Payee Email',
      'Payee Phone',
      'Payee Routing Number',
      'Payee Bank Ac',
      'Payee Account Type',
      'Payee Addr Line #1',
      'Payee Addr Line #2',
      'Payee City',
      'Payee State',
      'Payee Zip',
      'On Behalf of'
    ];
  }

  static checkFields(): string[] {
    return [
      'From Bank AC',
      'Amount',
      'Description',
      'Payee Name',
      'Payee Nick Name',
      'Payee Email',
      'Payee Phone',
      'Payee Addr Line #1',
      'Payee Addr Line #2',
      'Payee City',
      'Payee State',
      'Payee Zip',
      'On Behalf of'
    ];
  }
}

export class CardTimeInterval {
  static timeIntervalList(): {
    name: string;
    value: string;
    checked: boolean;
  }[] {
    return [
      {
        name: 'Per Transactions',
        value: 'perTransaction',
        checked: false
      },
      {
        name: 'Per Month',
        value: 'monthly',
        checked: false
      },
      {
        name: 'All Time',
        value: 'allTime',
        checked: false
      }
    ];
  }
}

export interface INotificationStatus {
  ach: IAchConfiguration;
  wire: IWireConfiguration;
  giftCard: IGiftcardConfiguration;
  cloud_settings: ICloudSettings;
  otp_timeout: number;
  ach_notification: number;
  wire_notification: number;
  giftcard_notification: number;
}

export interface IAchConfiguration {
  email: number;
  sms: number;
}

export interface IWireConfiguration {
  email: number;
  sms: number;
}

export interface IGiftcardConfiguration {
  email: number;
  sms: number;
}

export interface ICloudSettings {
  email_customize: number;
  receiver_notification: number;
  notification_settings: number;
}
export interface IChangeNotificationStatus {
  settings: {
    ach: { email: number; sms: number };
    wire: { email: number; sms: number };
    giftCard: { email: number; sms: number };
    otp_timeout: number;
  };
}

export interface IOnBehalfOf {
  id: string;
  text: string;
  createdAt: string;
}

export interface IOnBehalfOfById {
  text: string;
}

export interface IOnBehalfOfUpdate {
  id: string;
  text: string;
}

export interface IEmailTemplate {
  id?: string;
  notificationType: string;
  contents: {
    email: {
      subject: string;
      content: string;
    };
    sms: {
      content: string;
    };
  };
}

export interface INotificationTemplate {
  content: IContent;
  id?: string;
}

export interface IContent {
  email: IEmail;
  sms: ISms;
}

export interface IEmail {
  subject: string;
  content: string;
}

export interface ISms {
  content: string;
}

export interface IAddOnBehalfOf {
  id: string;
  text: string;
}

export interface IBulkImportStep1 {
  success: boolean;
  message?: string;
  data: {
    success?: ISuccess[];
    errors: IError[];
  };
}

export interface ISuccess {
  account_number: string;
  amount: string;
  description: string;
  payee_name: string;
  payee_nick_name: string;
  payee_email: string;
  payee_phone: string;
  payee_routing_number: number;
  payee_account_number: number;
  payee_account_type: string;
  payee_address1: string;
  payee_address2: string;
  payee_city: string;
  payee_state: string;
  payee_country: string;
  payee_zip: number;
  on_behalf_of: string;
  account_id: string;
  fdic_account_id: number;
  person_id: string;
  process_id: string;
}

export interface IError {
  account_number: string;
  amount: string;
  description: string;
  payee_name: string;
  payee_nick_name: string;
  payee_email: string;
  payee_phone: string;
  payee_routing_number: number;
  payee_account_number: string;
  payee_account_type: string;
  payee_address1: string;
  payee_address2: string;
  payee_city: string;
  payee_state: string;
  payee_country: string;
  payee_zip: string;
  on_behalf_of: number;
  errors: IErrorsRes;
}

export interface IErrorsRes {
  [key: string]: string[];
}

export interface IBulkPaymentConfig {
  enable_bulk_import_ach: string;
  enable_bulk_import_domestic_wire: string;
  enable_bulk_import_check: string;
  enable_bulk_import_gif_card: string;
}

export interface ISiteSettings {
  bulk_payment_enabled: IBulkPaymentEnabled;
}

export interface IBulkPaymentEnabled {
  ach: string;
  domesticWire: string;
  check: string;
  giftCard: string;
}

export interface ISampleFiles {
  ach: string;
  domesticWire: string;
  check: string;
  giftCard: string;
}

export interface IQrcode {
  id: string;
  uuId: string;
  accountId: string;
  slug: string;
  createdForId: string;
}

export interface IPayWithZilAccounts {
  accounts: IAccount[];
}

export interface IAccount {
  id: string;
  name: string;
  accountNumber: string;
}

export interface IAccountDetails {
  accountHolder: string;
  accountNumber: string;
  uniqueName: string;
}

export interface IQuikPayByPhone {
  taransferId: string;
  accountId: string;
  contactId: string;
  amount: string;
  account_number: string;
  routing_number: string;
  status: string;
  description: string;
  transactionId: string;
  transactionStatus: string | number;
  transactionType: string;
  transferType: string;
  transferDate: string;
}

export interface ITransactionStatment {
  totalDebit: number;
  totalCredit: number;
  timePeriod: ITimePeriod;
  debitWidth: number;
  creditWidth: number;
}

export interface IAirWallexTransactionStatement {
  amount: number;
  balance: number;
  date: string;
  description: string;
  transactionType: string;
}

export interface ITimePeriod {
  end: string;
  start: string;
}

export interface ICloudBankOverview {
  physicalCard: number;
  virtualCard: number;
  totalCard: number;
  accounts: number;
  cardSpend: number;
  lastUsed: {
    date: string;
    difference: number;
  };
  notification: {
    notification_type: string;
    status: number;
    created_at: string;
    updated_at: string;
  }[];
  isAlertModalEnabled: number;
}

export interface ICloudInternalTransferPayload {
  fromAccount: string;
  amount: number;
  description: string;
  toAccount: string;
}

export interface ICloudIntraTransferPayload {
  accountId: string;
  amount: number;
  description: string;
  payeeId: string;
  payeeBankAccount: string;
  payeeEmail: string;
}
