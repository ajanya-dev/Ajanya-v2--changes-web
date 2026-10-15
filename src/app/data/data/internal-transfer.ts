export interface ICloudAccount {
  id: string;
  businessId: string;
  label: string;
  routingNumber: string;
  accountNumber: string;
  status: string;
  type: string;
  programId: string;
  isVerified: boolean;
  verifiedAt: string;
  acceptedTerms: boolean;
  interest: string;
  fees: string;
  currency: string;
  availableBalance: string;
  sponsorBankName: string;
  createdAt: string;
  modifiedAt: string;
  pendingDebit: string;
  pendingCredit: string;
  createdPersonId: string;
  accountInterestFrequency: string;
  metadata?: IMetadata;
  config: IConfig;
  familyId: string;
  title: string;
}

export interface IMetadata {
  createdForId: number;
  partnerId: string | number;
}

export interface IConfig {
  card: IConfigCard;
  send: IConfigSend;
  receive: IReceive;
  limits: IConfigLimits;
  fallback: IConfigFallback;
  incoming: IConfigIncoming;
}

export interface IConfigCard {
  virtual: IVirtual;
  physical: IPhysical;
}

export interface IVirtual {
  enabled: boolean;
  count: string;
}

export interface IPhysical {
  enabled: boolean;
  count: string;
}

export interface IConfigSend {
  intrabank: IIntrabank;
  ach: IAch;
  wire: IWire;
  check: ICheck;
  card: ICard2;
  debitCard: IDebitCard;
  internationalWire: IInternationalWire;
  digitalCheck: IDigitalCheck;
  physicalCard: IPhysicalCard;
  crossBorder: ICrossBorder;
}

export interface IIntrabank {
  enabled: boolean;
}

export interface IAch {
  enabled: boolean;
  sameDay: boolean;
}

export interface IWire {
  enabled: boolean;
}

export interface ICheck {
  enabled: boolean;
}

export interface ICard2 {
  enabled: boolean;
}

export interface IDebitCard {
  enabled: boolean;
}

export interface IInternationalWire {
  enabled: boolean;
}

export interface IDigitalCheck {
  enabled: boolean;
}

export interface IPhysicalCard {
  enabled: boolean;
}

export interface ICrossBorder {
  enabled: boolean;
}

export interface IReceive {
  intrabank: IReceiveIntrabank;
  ach: IReceiveAch;
  check: IReceiveCheck;
  debitCard: IReceiveDebitCard;
}

export interface IReceiveIntrabank {
  enabled: boolean;
}

export interface IReceiveAch {
  enabled: boolean;
  sameDay: boolean;
}

export interface IReceiveCheck {
  enabled: boolean;
}

export interface IReceiveDebitCard {
  enabled: boolean;
}

export interface IConfigLimits {
  receive: ILimitsReceive;
  send: ILimitsSend;
}

export interface ILimitsReceive {
  daily: string;
  monthly: string;
  intrabank: ILimitsReceiveIntrabank;
  ach: ILimitsReceiveAch;
  check: ILimitsReceiveCheck;
  debitCard: ILimitsReceiveDebitCard;
}

export interface ILimitsReceiveIntrabank {
  daily: string;
  monthly: string;
}

export interface ILimitsReceiveAch {
  daily: string;
  monthly: string;
}

export interface ILimitsReceiveCheck {
  daily: string;
  monthly: string;
}

export interface ILimitsReceiveDebitCard {
  daily: string;
  monthly: string;
}

export interface ILimitsSend {
  daily: string;
  monthly: string;
  intrabank: IIntrabank4;
  ach: LimitsSendAch;
  domesticWire: IDomesticWire;
  internationalWire: ILimitsSendInternationalWire;
  check: ILimitsSendCheck;
  card: ILimitsSendCard;
  debitCard: ILimitsSendDebitCard;
  crossBorder: ILimitsSendCrossBorder;
}

export interface IIntrabank4 {
  daily: string;
  monthly: string;
}

export interface LimitsSendAch {
  daily: string;
  monthly: string;
}

export interface IDomesticWire {
  daily: string;
  monthly: string;
}

export interface ILimitsSendInternationalWire {
  daily: string;
  monthly: string;
}

export interface ILimitsSendCheck {
  daily: string;
  monthly: string;
}

export interface ILimitsSendCard {
  daily: string;
  monthly: string;
}

export interface ILimitsSendDebitCard {
  daily: string;
  monthly: string;
}

export interface ILimitsSendCrossBorder {
  daily: string;
  monthly: string;
}

export interface IConfigFallback {
  received: string;
}

export interface IConfigIncoming {
  achPull: AchPull;
}

export interface AchPull {
  enabled: boolean;
  allowedOriginators: string;
  blockedOriginators: string;
}
