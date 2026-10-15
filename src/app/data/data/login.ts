import { ILoginSlider, ISocialIcon } from 'src/app/modules/auth/model/login';

export class Login {
  static sliderDetails(): ILoginSlider[] {
    return [
      {
        heading: {
          main: 'Pay vendor Taxes & Rent Using credit cards.',
          sub: "Pay Anyone with your credit cards even if they don't accept it."
        },
        content: {
          main: 'Cash Flow Issues?',
          sub: 'Use your credit card balance to pay. Earn rewards from your credit card companies. Keep Cash flow or use cards when low on cash. Pay any amount using your credit card to Anyone.'
        },
        image: {
          title: 'Payment with credit card',
          url: '../../../../assets/images/login/swipper/payment_with_credit_card.png',
          link: ''
        }
      },
      {
        heading: {
          main: 'Future Cloud Banking Steps Ahead',
          sub: 'Your Affordable cloud banking partner is at home now!'
        },
        content: {
          main: 'Cloud Banking Solutions',
          sub: 'Do everything you do at your Local bank and beyond at Cloud Bank without going to a bank. Send Wire, ACH, Gift Card, and Visa Card in one click. Instantly Push or pull from Debit Card. Intelligent Vendor payable and receivable system.'
        },
        image: {
          title: 'Cloud banking',
          url: '../../../../assets/images/login/swipper/cloud_banking_partner.png',
          link: ''
        }
      },
      {
        heading: {
          main: 'Accounts Payable & Receivable',
          sub: 'Get the most out of accounts payable and receivable features.'
        },
        content: {
          main: 'Streamline Business Banking',
          sub: 'Process accounts payable and receivable effortlessly with our all-in-one platform. Pay and Get paid by Digital checks, Printable checks, eChecks, ACH, RTP, and one-click check mailing at low transaction fees.'
        },
        image: {
          title: 'Accounts Payable & Receivable',
          url: '../../../../assets/images/login/swipper/payableandreceivable.png',
          link: ''
        }
      }
    ];
  }

  static socialIcons(): ISocialIcon[] {
    return [
      {
        name: 'Google',
        image: 'google.svg',
        url: 'loginwith/google'
      },
      {
        name: 'Linkedin',
        image: 'linkedIn.svg',
        url: 'loginwith/linkedin'
      },
      {
        name: 'Microsoft',
        image: 'microsoft.svg',
        url: 'loginwith/microsoft'
      },
      {
        name: 'Xero',
        image: 'xero.svg',
        url: 'api/v4/loginwith/xero',
        styles: { img: { width: '29px', height: '29px' } }
      },
      {
        name: 'Amazon',
        image: 'amazon.svg',
        url: 'loginwith/amazon',
        styles: { img: { width: '40px', height: '40px' } }
      },
      {
        name: 'Azure',
        image: 'office.svg',
        url: 'loginwith/azure'
      },
      // {
      //   name: 'Freshbooks',
      //   image: 'freshbooks.svg',
      //   url: 'api/v4/loginwith/freshbooks',
      //   styles: { img: { width: '180px', height: '30px' } }
      // },
      {
        name: 'Twitter',
        image: 'twitter.svg',
        url: 'loginwith/twitter',
        styles: { others: 'ml-[14px] !w-min' }
      },
      {
        name: 'Intuit',
        image: 'intuit.svg',
        url: 'socialauth/quickbook',
        styles: { img: { width: '124px', height: '24px' } }
      }
    ];
  }
}
