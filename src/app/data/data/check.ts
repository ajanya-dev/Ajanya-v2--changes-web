export class CheckDesign {
  //==== CHECK DESIGN TYPES
  static checkDesigns(): any[] {
    return [
      {
        designType: 'Check on top',
        designImg:
          '../../../../../assets/images/check/check_designs/check_on_top.png',
        routing: '/manage/design/step-2',
        checkType: '1'
      },
      {
        designType: 'Check on bottom',
        designImg:
          '../../../../../assets/images/check/check_designs/check_on_bottom.png',
        routing: '/manage/design/step-2',
        checkType: '3'
      },
      {
        designType: '3 per page',
        designImg:
          '../../../../../assets/images/check/check_designs/3_per_page.png',
        routing: '/manage/design/step-2',
        checkType: '4'
      },
      {
        designType: 'Check on middle',
        designImg:
          '../../../../../assets/images/check/check_designs/check_on_middle.png',
        routing: '/manage/design/step-2',
        checkType: '2'
      },
      {
        designType: 'Pre-printed check',
        designImg:
          '../../../../../assets/images/check/check_designs/pre_printed_check.png',
        routing: '/manage/design/step-2',
        checkType: '5',
        templeteType: '17'
      },
      {
        designType: 'Wallet',
        designImg:
          '../../../../../assets/images/check/check_designs/wallet.jpg',
        routing: '/manage/design/step-2',
        checkType: '5',
        templeteType: '14'
      }
    ];
  }
}

export class MailChecks {
  static checks() {
    return [
      {
        id: 1,
        shipping_type: ['First Class', 'Second Class'],
        check_paper: ['Normal Paper', 'A4 Paper'],
        payee_name: 'Payee Name',
        email: 'sajith@gmail.com',
        phone: '789889987',
        check: '4566',
        amount: 1000,
        attachment: 'icon'
      },
      {
        id: 2,
        shipping_type: ['First Class', 'Second Class'],
        check_paper: ['Normal Paper', 'A4 Paper'],
        payee_name: 'Payee Name',
        email: 'sajith@gmail.com',
        phone: '789889987',
        check: '4566',
        amount: 1000,
        attachment: 'icon'
      }
    ];
  }
}
