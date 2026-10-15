import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { IUserInfo } from '../../models/user';
import { IKybMissingField } from '../../shared/persona-v4/model/persona-v4';

export interface IHeaderDetails {
  userInfo: IUserInfo;
  isSubscribed: number;
  isShowTrailPeriod: number;
  allCompanies: IAllCompanies;
  personalInfo: IPersonalInfo;
  BusinessInfo: IBusinessInfo;
  wallet: IWallet;
  totalMailCredit: ITotalMailCredit;
  achEnabled: number;
  trialPeriodEndsInDays: number;
  trialPeriodEndDate: string;
  enabledPlugins: string[];
  internationalPaymentEnabled: number;
  pingpongEnabled: number;
  kycStatus: number;
  showAchModel: number;
  loginCount: number;
  isSubscribedEnd: number;
  subscribedEndDate: string;
  whatsNew: number;
}

export interface IAllCompanies {
  ownCompanies: IOwnCompany[];
  activeCompanyName: string;
  invitedCompanies: IInvitedCompany[];
  user_id?: string;
}

export interface IOwnCompany {
  id: number | string;
  companyId: string;
  companyName: string;
  isItDefault?: number;
  companyLogo?: string;
  companyLogoUrl?: string;
  isClosed?: number;
  type: string;
  businessInfo?: IBusinessInfo;
  customerRef?: string | null;
}

export interface IInvitedCompany {
  id: string;
  companyId: string;
  companyName: string;
  isItDefault: boolean;
  status: number;
  companyLogo: string;
  companyLogoUrl: string;
  type: string;
  createdAt?: string;
  isClosed:number
}

export interface IPersonalInfo {
  userId: number;
  name: string;
  lName: string;
  nickName: string;
  email: string;
  phone: string;
  AddressLine1: string;
  AddressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  ssn: string;
  dateOfBirth: string;
  profilePicLink: string;
  profilePic: string;
  isTwoFactorEnabled: number;
  isAdvancedTwoFactorEnabled: number;
  isLegalEnabled: string | number;
  AttachmentSettings: { echeck: number; check_mail: number; ach: number };
  timezone: string;
}

export interface IBusinessInfo {
  companyName: string;
  companyAddressLine1: string;
  companyAddressLine2: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyCountry: string;
  entityType: string;
  dba: string;
  formationDate: string;
  industryType: string;
  ein: string;
  companyLogo?: string;
  companyLogoUrl?: string;
}

export interface IWallet {
  totalCurrentBalance: string;
  totalAvailableBalance: string;
}

export interface ITotalMailCredit {
  credit: string;
}

export interface IHeaderLinks {
  title: string;
  icon: string;
  id: string;
  routerLink?: string;
  type?: string;
  onClick?: string;
  faIcon?: IconProp;
  iconColor?: string;
  iconBackground?: string;
  favoriteIconId?: number;
  /** v4 destination for plain-navigation tiles (favorites drawer data-driven dispatch). */
  v4RouterLink?: string;
  /** True when the tile needs custom logic beyond a plain navigate (opens a modal, permission-gated, etc.) — favorites drawer keeps a dedicated handler for these. */
  requiresCustomAction?: boolean;
}

export interface IWhatsNewSlider {
  [x: string]: any;
  created_at: string;
  description: string;
  id: number;
  published_at: string;
  status: string;
  summary: string;
  title: string;
  updated_at: string;
  url: URL;
}
export interface INotificationList {
  notifications: INotificationDetails[];
  count?: number;
  unreadNotificationsCount?: number;
  newNotificationCount?: number;
}

export interface INotificationDetails {
  id: string;
  readAt: boolean;
  createdAt?: string;
  viewedAt?: string;
  notification: INotificationContent;
  dateDuaration?: string;
}

export interface IGroupedNotification {
  day: string;
  date: string;
  notifications: INotificationDetails[];
}

export interface INotificationContent {
  icon?: string;
  title?: string;
  discription?: string;
  action_link: string;
  type?: string;
  color?: 'orange' | 'blue' | 'green' | 'red';
  notification_type?: string;
  application_type?: string;
}

export interface IHeaderData {
  userInfo: IUserInfo;
  isSubscribed: number;
  currentPlan: string;
  isShowTrailPeriod: number;
  allCompanies: IAllCompanies;
  personalInfo: IPersonalInfo;
  BusinessInfo: IBusinessInfo;
  wallet: IWallet;
  totalMailCredit: ITotalMailCredit;
  achEnabled: number;
  trialPeriodEndsInDays: number;
  trialPeriodEndDate: string;
  internationalPaymentEnabled: number;
  pingpongEnabled: number;
  rippleBusinessInternationalPaymentEnabled: number;
  ripplePersonalInternationalPaymentEnabled: number;
  
  /**
   * Possible Values
   * `0` - Pending
   * `1` - In Review
   * `2` - Approved
   * `3` - Rejected
   * `4` - Partner Approved
   */
  kycStatus: number;
  showAchModel: number;
  loginCount: number;
  isSubscribedEnd: number;
  subscribedEndDate: string;
  whatsNew: number;
  plexeOfferReadyUser: number;
  plexeCreditLimit: number;
  enabledPlugins: string[];
  applyForPlexe: number;
  creditCardUser: number;
  adpRunUser: number;
  kybBypassedUser: number;
  isApprovedForProcessNow: number;
  showTrialPeriodPopup: '0' | '1'; // '0' - dont show trial period over alert, '1' - show trial period over alert
  isActivePapAffiliateUser: number; // 0 - (Inactive), 1 - (Active)
  isNewUserForKycCreditCard: number; // '0' - existing user, '1' - new user
  isLoggedInAsClient: boolean; // if value is true that means logged user is user otherwised logged user is master.
  allow_three_ds_testing: 1 | 0;
  nmi_gatewayjs_checkout_key: string;
  showInternationalPaymentModal: number; // 0 - don't show modal, 1 - show modal
  showInternationalPaymentWelcomeModal: number; // 0 - don't show modal, 1 - show modal
  rippleInternationalPaymentEnabled:number;
  isCreditCardPaymentEnabled: number;
  userQuickNavigationItems: number[];
  cardPaymentMaintananceMessage?:string;
  reRunVerificationData?:{
    id:string;
    business_id: string;
    status:string;
  } | null;
  kybPersonaVerificationData?:{
    business_id: string;
    inquiry_id: string;
    status: string;
    show_modal: boolean;
    missing_fields?: IKybMissingField[];
  } | null;
  eddRequestData?:{
    id: string;
    kyb_id: string;
    edd_inquiry_id: string;
    edd_inquiry_link: string;
    status: string;
    created_at:string;
    days_remaining:number;
    deadline_at: string;
    show_warning: boolean;
    warning_message:string | null
  } | null;
  isComplianceScreeningFrozen: 1 | 0;
  isRegisteredAfterV2Launch?: 1 | 0;
  credit_card_gateway_switching_status: 1 | 2 | 3 | 4;
  credit_card_gateway_type: 4 |5;
  managedPartner:{
    approvalPolicy:0|1
  }
}

export interface IOwner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  ownershipPercentage: number;
  fullSsn: string;
  birthDate?: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface INewNotification {
  state: string;
  icon: string;
  title: string;
  discription: string;
  action_link: string;
}
