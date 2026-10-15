export class Redirections {
  static v2RedirectionsInV3() {
    return [
      {
        path: '/manage/design/step-1',
        redirect: '/manage/users/add-bank-manually'
      },
      {
        path: '/manage/payment-rail/paid',
        redirect: '/manage/payments-table/index'
      },
      {
        path: '/manage/fdicbankaccount/account',
        redirect: '/manage/cloud-bank/index'
      },
      {
        path: '/manage/bankaccount/index',
        redirect: '/manage/bank-accounts/index'
      },
      {
        path: '/manage/payee/index',
        redirect: '/manage/payees'
      },
      // {
      //   path: '/manage/users/verify-email-phone',
      //   redirect: '/manage/users/verify-email-phone'
      // },
      {
        path: '/manage/cheque/checkrecords',
        redirect: '/manage/payments-table/check'
      },
      {
        path: '/manage/virtual-card/receive',
        redirect: '/manage/cards/receive'
      }
    ];
  }
}
