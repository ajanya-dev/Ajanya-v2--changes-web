export enum PaymentSource {
  BankAccount = 'bankaccount',
  CreditCard = 'card',
  Wallet = 'wallet',
  CloudBank = 'cloud'
}

export enum PaymentMethod {
  Check = 'check',
  ACH = 'ach',
  SameDayACH = 'same-ach',
  Wire = 'wire',
  VirtualCard = 'virtual-card',
  RTP = 'rtp',
  InternationalPayment = 'international-payment',
  CheckMail = 'check_mail',
  CheckPrint = 'check_print',
  CheckEmail = 'check_email',
  LetPayeeChoose = 'let-payee-choose'
}

export enum SendPaymentMode {
  Create = 'CREATE',
  Edit = 'EDIT',
  Clone = 'CLONE'
}

export enum SendPaymentStep {
  Amount = 'amount',
  Payee = 'payee',
  Source = 'source',
  Method = 'method',
  SourceAccount = 'sourceAccount',
  Details = 'details',
  Actions = 'actions'
}
