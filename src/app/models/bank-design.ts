export interface ICheckBody {
  checkBody: {
    bankAccountAddressLine1: string;
    bankAccountAddressLine2: string;
    bankAccountCity: string;
    bankAccountEmail: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankAccountPhone: string;
    bankAccountState: string;
    bankAccountType: string;
    bankAccountZip: string;
    bankCity: string;
    bankIdentity: string;
    bankName: string;
    bankRoutingNumber: string;
    bankZip: string | Blob;
    checkSerialNumber: string;
    checkType: string;
    country: string;
    financialNumber: string;
    logoImage: string;
    signatureImage: string;
    transitNumber: string;
    bankAddress: string;
    bankState: string;
  };
  customizeTemplateForCheckDesignId: number;
  returnUrl: string;
}
