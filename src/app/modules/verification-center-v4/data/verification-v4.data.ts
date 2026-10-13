import {
  ShieldCheck,
  Building2,
  Landmark,
  CreditCard
} from 'lucide-angular';
import { StepConfig } from '../models/verification-v4.model';

export const EMAIL_PLACEHOLDER = '{email}';

/** Documents the re-verification modal asks for, listed up front here. */
export const RERUN_KYB_DOCS = ['Formation document'];
export const EDD_DOCS = [
  'Financial statements',
  'Bank statement',
  'Business plan or executive summary',
  'Key executives information'
];

export const STEP_CONFIGS: StepConfig[] = [
  {
    id: 1,
    key: 'account-setup',
    title: 'Account Setup',
    description: 'Verify your email address and phone number.',
    descriptionVariants: {
      neither: 'Verify your email address and phone number.',
      emailVerified:
        'Your email is already verified — just confirm your phone number.',
      phoneVerified:
        'Your phone is already verified — just confirm your email address.'
    },
    iconName: 'ShieldCheck',
    icon: ShieldCheck,
    completedText: 'Email and phone verified — you’re reachable and secure.',
    actionText: 'Account Setup',
    badge: 'Unlocks Check Payment',
    unlockBadge: 'Unlocks Check Payment',
    unlockBadgeColor: 'text-v4-accent-violet-color',
    itemsLabel: "WHAT YOU'LL DO",
    doneItemsLabel: 'VERIFIED',
    items: [
      { text: `Email — ${EMAIL_PLACEHOLDER}`, verifyKey: 'email' },
      {
        text: 'Verify your phone with a one-time code',
        verifyKey: 'phone',
        verifiedText: 'Phone — one-time code confirmed'
      }
    ],
    doneItems: [
      { text: `Email — ${EMAIL_PLACEHOLDER}` },
      { text: 'Phone — one-time code confirmed' }
    ],
    chipTitle: 'Check Payments',
    moreFeatures: [
      'Print checks instantly',
      'We mail it for you',
      'Send as eCheck'
    ],
    timeRequired: 'about 1 minute',
    details: {
      longDescription:
        'Complete your account setup by verifying your email and phone number. Both are required to unlock the Check feature and ensure account security. This step upgrades you to Level 1 verification.',
      benefits: [
        'Secure account access',
        'Two-factor authentication',
        'Unlock Check feature',
        'Level 1 verification status'
      ],
      requirements: ['Valid email address', 'Active mobile phone'],
      timeRequired: '5-7 minutes'
    },
    buttonText: 'Start'
  },
  {
    id: 2,
    key: 'business-verification',
    title: 'Verify Business Details',
    description:
      'Complete your business verification through Persona to unlock all payment features',
    iconName: 'Building2',
    icon: Building2,
    completedText: 'Business verification approved via Persona.',
    actionText: 'Verify Business',
    unlockBadge: 'Unlock wallet, credit card and more!',
    unlockBadgeColor: 'text-v4-accent-violet-color',
    showPersonaInfo: true,
    itemsLabel: 'HAVE THESE READY',
    doneItemsLabel: 'SUBMITTED',
    items: [
      { text: 'Business formation document' },
      { text: 'Government-issued owner ID' }
    ],
    doneItems: [
      { text: 'Business formation document' },
      { text: 'Government-issued owner ID' }
    ],
    chipTitle: 'All payment features',
    moreLabel: '+9 more',
    moreFeatures: [
      'Wallet & Credit Card',
      'Same Day ACH',
      'ACH / Direct Deposit',
      'Wire',
      'Real Time Instant Payment',
      'International Payment',
      'Virtual Card',
      'Check Mail (USPS / FedEx)',
      'Check Email (Instant)',
      'Check Print (Yourself)'
    ],
    timeRequired: 'about 3 minutes',
    lockNote: 'Opens after step 1',
    details: {
      longDescription:
        'Business verification unlocks premium features and higher limits. We use Persona to verify your business registration, owner identification, and business address. This process ensures compliance and unlocks 10+ payment modes, free wallet transactions, and credit card rewards.',
      benefits: [
        '10+ payment modes unlocked',
        'Free wallet transactions',
        'Credit card rewards program',
        'Higher transaction limits',
        'Priority customer support'
      ],
      requirements: [
        'Business registration documents',
        'Owner/Director ID',
        'Business address proof',
        'EIN or Tax ID'
      ],
      timeRequired: '5-10 minutes to submit, 24-48 hours for review'
    },
    buttonText: 'Continue'
  },
  {
    id: 3,
    key: 'bank-verification',
    title: 'Verify Payment Source',
    description:
      'Add and verify a bank account or credit card as the source of your payments.',
    iconName: 'Landmark',
    icon: Landmark,
    completedText: 'Payment source verified',
    actionText: 'Add a payment source',
    badge: 'Final Step',
    itemsLabel: 'CHOOSE A SOURCE',
    doneItemsLabel: 'VERIFIED',
    items: [
      { text: 'Bank account — verify to move funds', icon: Landmark },
      { text: 'Credit card — added instantly', icon: CreditCard }
    ],
    doneItems: [{ text: 'Payment source added and verified' }],
    chipTitle: 'ACH & Wire',
    moreLabel: '+2 more',
    moreFeatures: [
      'ACH / Direct Deposit',
      'Wire',
      'Real Time Instant Payment',
      'Same Day ACH'
    ],
    timeRequired: 'about 1 minute',
    lockNote: 'Opens after Business Verification',
    hideTimeOnActive: true,
    details: {
      longDescription:
        "Payment source verification confirms ownership of your linked account. Instant verification via Plaid happens automatically. For manual connections, we'll deposit small amounts (micro-deposits) that you'll need to verify within 1-2 business days.",
      benefits: [
        'Confirm account ownership',
        'Enable higher transaction limits',
        'Unlock premium payment methods'
      ],
      requirements: [
        'Connected bank account',
        'Access to online banking (for instant)',
        'Ability to view micro-deposits (for manual)'
      ],
      timeRequired: 'Instant via Plaid, or 1-2 days for micro-deposits'
    },
    buttonText: 'Add a payment source'
  }
];
