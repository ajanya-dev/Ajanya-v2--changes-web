import {
  PlanFeaturesStaticFields,
  PlanFeaturesStaticValues
} from '../../model/subscription';

export const planFeatures: PlanFeaturesStaticFields = [
  {
    header: 'From Wallet',
    bgColor: 'var(--subscription-red)',
    subItems: [
      { name: 'Check Print, Email Check, ACH' },
      { name: 'Wire (Domestic)' },
      { name: 'Wire (International)' }
    ]
  },
  {
    header: 'From Bank',
    bgColor: 'var(--subscription-green)',
    subItems: [
      { name: 'Check Print' },
      { name: 'Email Check' },
      { name: 'ACH' },
      { name: 'Wire (Domestic)' },
      { name: 'Wire (International)' },
      { name: 'Pay by Credit Card' }
    ]
  },
  {
    header: 'Features',
    bgColor: 'var(--secondary-background-color)',
    subItems: [
      { name: 'Bank Accounts Allowed' },
      { name: 'International Payments' },
      { name: 'Users' },
      { name: 'Positive Pay (Per Account)' },
      {
        name: 'Full Integration Suite',
        desc: '(including accounting software)'
      },
      { name: 'Receive Payment Link' },
      { name: 'Cloud Banking' },
      { name: 'Bill & Invoice' },
      { name: 'Business Tools' },
      { name: 'Deposit Slip and Cash Expense' },
      { name: 'Check Draft/Manual ACH' },
      { name: 'Account Manager' },
      { name: 'Payments/Banking By API' },
      { name: 'Whitelabel Capability' },
      { name: 'Own Server' },
      { name: 'Customized Email Templates' },
      { name: 'Premium Check <br />& Invoice Templates' },
      { name: 'Custom Data Retention Policies' }
    ]
  },
  {
    header: 'Check Mailing',
    bgColor: 'var(--secondary-background-color)',
    subItems: [
      { name: 'Express Mail' },
      { name: 'FedEx Overnight' },
      { name: 'FedEx Overnight Canada' },
      { name: 'Priority Mail USPS' },
      { name: 'First Class with tracking' },
      { name: 'First Class Canada' },
      { name: 'USPS First Class' },
      { name: 'Document Attachment' }
    ]
  }
];

export const planFeaturesValues: PlanFeaturesStaticValues = {
  'pay-as-you-go-monthly-v3': {
    fromWallet: [
      { value: 'Free', type: 'string', color: true },
      { value: '$12.00', type: 'string' },
      { value: '$25.00', type: 'string' }
    ],
    fromBank: [
      { min: '1%', max: '$1.00', type: 'minMax' },
      { min: '1%', max: '$1.00', type: 'minMax' },
      { min: '1%', max: '$5.00', type: 'minMax' },
      { value: '$15.00', type: 'string' },
      { value: '$30.00', type: 'string' },
      { value: '2.95%', type: 'string', color: true }
    ],
    features: [
      { value: '3', type: 'string' },
      { value: 'FX Rate', type: 'string', color: true },
      { value: '3', type: 'string' },
      { value: '$99.99', type: 'string' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' }
    ],
    checkMailing: [
      { value: '$34.99', type: 'string' },
      { value: '$24.99', type: 'string' },
      { value: '$24.99', type: 'string' },
      { value: '$12.99', type: 'string' },
      { value: '$7.50', type: 'string' },
      { value: '$2.99', type: 'string' },
      { value: '$1.50', type: 'string' },
      { value: '$1.00', type: 'string' }
    ]
  },
  'basic-monthly-v3': {
    fromWallet: [
      { value: 'Free', type: 'string', color: true },
      { value: '$12.00', type: 'string' },
      { value: '$25.00', type: 'string' }
    ],
    fromBank: [
      { min: '0.89%', max: '$0.90', type: 'minMax' },
      { min: '0.89%', max: '$0.90', type: 'minMax' },
      { min: '0.89%', max: '$4.75', type: 'minMax' },
      { value: '$14.00', type: 'string' },
      { value: '$28.00', type: 'string' },
      { value: '2.95%', type: 'string', color: true }
    ],
    features: [
      { value: '3', type: 'string' },
      { value: 'FX Rate', type: 'string', color: true },
      { value: '3', type: 'string' },
      { value: '$99.99', type: 'string' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' }
    ],
    checkMailing: [
      { value: '$34.99', type: 'string' },
      { value: '$24.99', type: 'string' },
      { value: '$24.99', type: 'string' },
      { value: '$12.99', type: 'string' },
      { value: '$7.50', type: 'string' },
      { value: '$2.99', type: 'string' },
      { value: '$1.25', type: 'string' },
      { value: '$0.85', type: 'string' }
    ]
  },
  'business-monthly-v3': {
    fromWallet: [
      { value: 'Free', type: 'string', color: true },
      { value: '$12.00', type: 'string' },
      { value: '$25.00', type: 'string' }
    ],
    fromBank: [
      { min: '0.79%', max: '$0.85', type: 'minMax' },
      { min: '0.79%', max: '$0.85', type: 'minMax' },
      { min: '0.79%', max: '$4.40', type: 'minMax' },
      { value: '$13.50', type: 'string' },
      { value: '$25.00', type: 'string' },
      { value: '2.95%', type: 'string', color: true }
    ],
    features: [
      { value: '5', type: 'string' },
      { value: 'FX Rate', type: 'string', color: true },
      { value: '5', type: 'string' },
      { value: '$99.99', type: 'string' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' }
    ],
    checkMailing: [
      { value: '$34.99', type: 'string' },
      { value: '$22.99', type: 'string' },
      { value: '$22.99', type: 'string' },
      { value: '$12.99', type: 'string' },
      { value: '$6.75', type: 'string' },
      { value: '$2.50', type: 'string' },
      { value: '$1.15', type: 'string' },
      { value: '$0.75', type: 'string' }
    ]
  },
  'business-plus-monthly-v3': {
    fromWallet: [
      { value: 'Free', type: 'string', color: true },
      { value: '$12.00', type: 'string' },
      { value: '$25.00', type: 'string' }
    ],
    fromBank: [
      { min: '0.59%', max: '$0.75', type: 'minMax' },
      { min: '0.59%', max: '$0.75', type: 'minMax' },
      { min: '0.59%', max: '$4.00', type: 'minMax' },
      { value: '$12.00', type: 'string' },
      { value: '$22.00', type: 'string' },
      { value: '2.95%', type: 'string', color: true }
    ],
    features: [
      { value: '10', type: 'string' },
      { value: 'FX Rate', type: 'string', color: true },
      { value: '10', type: 'string' },
      { value: '5 Free Accounts', type: 'string' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' },
      { value: false, type: 'check' }
    ],
    checkMailing: [
      { value: '$34.99', type: 'string' },
      { value: '$20.99', type: 'string' },
      { value: '$20.99', type: 'string' },
      { value: '$11.99', type: 'string' },
      { value: '$6.00', type: 'string' },
      { value: '$1.99', type: 'string' },
      { value: '$1.05', type: 'string' },
      { value: '$0.65', type: 'string' }
    ]
  },
  'enterprise-custom-monthly-v2': {
    fromWallet: [
      { value: 'Free', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true }
    ],
    fromBank: [
      { value: 'Custom', type: 'string', color: true, min: '', max: '' },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: '2.95%', type: 'string', color: true }
    ],
    features: [
      { value: 'Unlimited', type: 'string', color: true },
      { value: 'Custom Pricing', type: 'string', color: true },
      { value: 'Unlimited', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' }
    ],
    checkMailing: [
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true }
    ]
  },
  'enterprise-custom-yearly-v2': {
    fromWallet: [
      { value: 'Free', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true }
    ],
    fromBank: [
      { value: 'Custom', type: 'string', color: true, min: '', max: '' },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: '2.95%', type: 'string', color: true }
    ],
    features: [
      { value: 'Unlimited', type: 'string', color: true },
      { value: 'Custom Pricing', type: 'string', color: true },
      { value: 'Unlimited', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' },
      { value: true, type: 'check' }
    ],
    checkMailing: [
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true },
      { value: 'Custom', type: 'string', color: true }
    ]
  }
};
