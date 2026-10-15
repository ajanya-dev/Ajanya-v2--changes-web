import { IPlan } from '../model/login';

export const currentPlans: IPlan[] = [
  {
    id: '3n1ZoVel0e8pwba',
    planName: 'Pay as you go',
    planCode: 'pay-as-you-go-yearly',
    planPrice: '$ 0.00',
    anchorPrice: 0,
    monthlyPrice: '$ 0.00',
    billIntervalUnit: 'years',
    planCategoryType: 1,
    planTransactionFee: '1.00',
    planDynamicTexts: {
      textLine1: 'Initial Recharge $30',
      textLine2: 'Transaction Fee $1.00',
      textLine3: null,
      textLine4: null,
      textLine5: null,
      textLine6: null
    },
    headingFeature: 'Unlimited Access',
    planFeatures: [
      { name: 'Bank Account', more: 'No preset limit' },
      { name: 'Users', more: 'No preset limit' },
      { name: 'Unlimited Payments' },
      { name: 'Receive Payments' },
      { name: 'ACH / Direct deposit' },
      { name: 'Domestic / International wire' },
      { name: 'Payroll By Card' }
    ]
  },
  {
    id: 'AQdNDOGnRG0oMXR',
    planName: 'Premium',
    planCode: 'business-monthly-v2',
    planPrice: '$ 299.99',
    anchorPrice: 0,
    monthlyPrice: '$ 499.99',
    billIntervalUnit: 'months',
    planCategoryType: 3,
    planTransactionFee: '0.30',
    planDynamicTexts: {
      textLine1: 'Billed Annually $299.99',
      textLine2: 'Transaction Fee $0.30',
      textLine3: 'Free 50 Transaction in all features',
      textLine4: '+All Standard features',
      textLine5: null,
      textLine6: null
    },
    headingFeature: 'Monthly Access',
    planFeatures: [
      { name: 'Bank Accounts', more: 'No preset limit' },
      { name: 'Users', more: 'No preset limit' },
      { name: 'Unlimited Payments' },
      { name: 'Receive Payments' },
      { name: 'ACH / Direct deposit' },
      { name: 'Domestic / International wire' },
      { name: 'Payroll By Card' }
    ]
  },
  {
    id: 'AQdNDOGnRG0oMXR',
    planName: 'Business',
    planCode: 'business-2-monthly-v2',
    planPrice: '$ 299.99',
    anchorPrice: 0,
    monthlyPrice: '$ 49.99',
    billIntervalUnit: 'months',
    planCategoryType: 3,
    planTransactionFee: '0.30',
    planDynamicTexts: {
      textLine1: 'Billed Annually $299.99',
      textLine2: 'Transaction Fee $0.30',
      textLine3: 'Free 50 Transaction in all features',
      textLine4: '+All Standard features',
      textLine5: null,
      textLine6: null
    },
    headingFeature: 'Monthly Access',
    planFeatures: [
      { name: 'Bank Accounts', more: 'No preset limit' },
      { name: 'Users', more: 'No preset limit' },
      { name: 'Unlimited Payments' },
      { name: 'Receive Payments' },
      { name: 'ACH / Direct deposit' },
      { name: 'Domestic / International wire' },
      { name: 'Payroll By Card' }
    ]
  }
];
