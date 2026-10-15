export interface IPayeeBankVerificationReminderRes {
  success: boolean;
  data?: { message?: string };
  errorMsg?: string;
}

export interface IPayeeBankVerificationModalData {
  uuId: string;
  paymentDetails: {
    payeeName: string;
    amount: string;
    source: string;
    transferMode: string;
    status: string;
    createdAt: string;
    receiverAccountNumber?: string;
    isResendButtonEnabled:number
  };
}
