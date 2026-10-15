import { faDollarSign, faTv } from '@fortawesome/pro-solid-svg-icons';
import {
  faBuildingColumns,
  faCreditCard,
  faHeadset,
  faMoneyCheckDollarPen,
  faWallet
} from '@fortawesome/pro-regular-svg-icons';
import { environment } from 'src/environments/environment';

export const verificationData = {
  check: {
    id: 'check',
    header: 'Check',
    subHeader: 'Level 1 Features',
    desc: 'Verify your email and phone number to access features.',
    demo: false,
    image: {
      icon: faMoneyCheckDollarPen,
      subIcon: null,
      color: 'blue'
    },
    features: ['Print Checks', 'Send Checks via Email', 'Mail Checks'],
    sources: [{ name: 'Bank Account', icon: faBuildingColumns }],
    helpVideo: environment.env_id === 'zilMoney'  ? 'zilMoneyVerificationLevel1' : 'verificationLevel1'
  },
  payByCreditCard: {
    id: 'card',
    header: 'Pay by Credit Card',
    subHeader: 'Level 2 Features',
    desc: 'Quick personal verification with ID and Selfie',
    demo: false,
    image: {
      icon: faCreditCard,
      subIcon: null,
      color: 'yellow'
    },
    features: [
      'Payroll by Credit Card',
      'Pay Bills, Invoices & Vendors by Credit Card',
      'ACH',
      'Wire',
      'Mail Check',
      'Virtual Card'
    ],
    sources: [{ name: 'Credit Card', icon: faCreditCard }],
    helpVideo:'verificationLevel2'
  },
  digitalPayment: {
    id: 'payment',
    header: 'Digital Payment',
    subHeader: 'Level 2 Features',
    desc: 'Unlock advanced features by adding your business',
    demo: false,
    image: {
      icon: faTv,
      subIcon: faDollarSign,
      color: 'violet'
    },
    features: [
      'ACH',
      'Wire',
      'Check',
      'Check Draft',
      'Virtual Card',
      'International Payment',
      'Payroll by Credit Card',
      'Pay Bills, Invoice & Vendors by Credit Card'

    ],
    sources: [
      { name: 'Bank Account', icon: faBuildingColumns },
      { name: 'Cloud Bank', icon: faBuildingColumns },
      { name: 'Wallet', icon: faWallet },
      { name: 'Credit Card', icon: faCreditCard },
    ],
    helpVideo: environment.env_id === 'zilMoney'  ? 'zilMoneyVerificationLevel3' : 'verificationLevel3'
  },
  bookDemo: {
    id: 'demo',
    header: 'Instant Demo',
    subHeader: 'Learn More About the Platform',
    desc: 'Free demo to guide you through the platform',
    demo: true,
    image: {
      icon: faHeadset,
      subIcon: null,
      color: 'green'
    },
    features: [
      'Live Platform Walkthrough',
      'Payment Advice',
      'Plan Assistance',
      'Account Connection',
      'Live Support'
    ],
    sources: [],
    helpVideo:undefined
  }
} as const;
