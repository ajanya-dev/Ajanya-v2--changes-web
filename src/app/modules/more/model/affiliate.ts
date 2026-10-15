export interface IAffiliateJoin {
  success: boolean;
  message?: string;
  errorMsg?: string;
  errorCode?: string;
}

export interface IAffilaiteRefer {
  referral_link: string;
  affiliate_code: string;
  affiliate_link_base_url: string;
}

export interface IAffilateStatus {
  firstName: string;
  lastName: string;
  clicks: string;
  totalCost: number;
  totalCommissions: number;
  salesCount: string;
}

export interface IAffilaiteTable {
  name: string;
  value: number;
}

export interface IAdditionalData {
  clicks_data: ITransactionsData[];
  transactions_data: ITransactionsData[];
  impression_data: ITransactionsData[];
}

export interface ITransactionsData {
  name: string;
  value: number;
}

export interface IClickedData {
  totalRecords: number;
  rows: IRowData[];
}

export interface IRowData {
  clickId: string;
  countrycode?: string;
  datetime: string;
  ip: string;
  affiliateCode?: string;
}

export interface IAffiliatePayHistory {
  id: string;
  amount: number;
  dateinserted: string;
  users: number;
  status: string;
}

export interface IUserTransactionHistory {
  id: string;
  transId: string;
  commission: number;
  totalCost: number;
  orderId: string;
  productid: string;
  dateinserted: string;
  name?: string;
  rstatus: string;
  payoutstatus: string;
  userName: string;
  commissionTypeName: string;
  affiliateUserId: string;
  systemnote: string;
}

export interface IUserEarningsData {
  name: string;
  email: string;
  commission: number;
  created_at: string;
}

export interface IUserEarnings {
  totalRecords: number;
  rows: IUserEarningData;
}

export interface IUserEarningData {
  id: string;
  userid: string;
  name: string;
  creditAmount: number;
  username: string;
  amounttopay: number;
  pendingAmount: number;
  declinedAmount: number;
  accountuserid: string;
  referralCount:string
}

export interface IAffiliateForm {
  referalLink: string;
  fromDate: string;
  toDate: string;
}

export interface IUserCoupon {
  id: string;
  couponCode: string;
  zohoLinkedCoupon: string;
  usedCount: number;
  createdAt: string;
}

export interface IAffiliateClickedList {
  ip: string;
  ipAddress: string;
  clicked: string;
  signUp: string;
  subscribed: string;
  total: number;
}

export interface IAffiliateGetWithdrawRequest {
  name: string;
  address: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  amount: string;
  status: string;
}

export interface IAffiliateRequestWithdraw {
  amount: string;
  name: string;
  phone: string;
  email: string;
  addressLine_1: string;
  addressLine_2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface IAffiliateRedeemerDetails {
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  availableBalance: string;
}

export interface IAffiliateReferralList {
  ip: string;
  ipAddress: string;
  clicked: string;
  signUp: string;
  subscribed: string;
  total: number;
}

export interface IAffiliateReferralActivity {
  ipAddress: string;
  date: string;
  earning: string;
  reason: string;
}

export interface IRefillCoupon {
  uu_id: string;
  amount: string;
  coupon_code: string;
  status: number;
  applied_count: number;
}

export interface IAffiliateNode {
  affiliate_user: string;
  affiliate_user_id: number;
  level: number;
  clicks_count: number;
  children: IAffiliateNode[];
}

export interface IMonthlyEarningData{
  month: string;
  value: number;
}
export interface IChartData { 
  monthly_earnings_chart: IMonthlyEarningData[];
  year:string
}