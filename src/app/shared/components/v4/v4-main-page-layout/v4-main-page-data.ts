import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faMoneyBills } from '@fortawesome/pro-solid-svg-icons';
import {
  Send,
  CreditCard,
  Users,
  FileText,
  DollarSign,
  CalendarDays,
  Receipt,
  Banknote,
  Link2,
  TrendingUp,
  Wallet,
  FileBox,
  Mail,
  Clock,
  Building2,
  Zap,
  Shield,
  CircleCheck,
  Layers,
  Globe,
  Package,
  Database,
  Settings,
  User,
  Lock,
  Bell,
  LucideIconData
} from 'lucide-angular';
import { IV4Benefit } from 'src/app/shared/components/v4/v4-main-page-benefits/v4-main-page-benefits.component';
import { environment } from 'src/environments/environment';

export interface IApiCard {
  icon: LucideIconData;
  label: string;
  value: string;
  valueColor?: string;
  subtitle: string;
  subtitleColor: string;
  iconBgColor: string;
  iconColor: string;
  comingSoon?: boolean;
}

export interface IFeatureCard {
  icon: LucideIconData;
  heading: string;
  description: string;
  buttonText: string;
  iconBgColor: string;
  iconColor: string;
  action?: string;
  routerLink?: string;
  queryParams?: Record<string, string>;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;
  fontIcon?:IconDefinition
}

export interface IFeatureSection {
  title: string;
  gridClass: string;
  cards: IFeatureCard[];
  customTemplate?: boolean;
}

export interface ICtaBanner {
  bgColor: string;
  titleColor: string;
  subtitleColor: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonStyle: string;
  buttonIcon?: string;
  buttonIconSize?: number;
  buttonDisabled?: boolean;
  badge?: { text: string; bgColor: string; textColor: string };
  icon?: LucideIconData;
}

export interface IBenefitsConfig {
  heading: string;
  items: IV4Benefit[];
}

export interface IMainPageConfig {
  title: string;
  subtitle: string;
  apiCards: IApiCard[];
  isLoading?: boolean;
  ctaBanner?: ICtaBanner;
  featureSections: IFeatureSection[];
  benefits?: IBenefitsConfig;
}

const {productName} = environment;

export const PAYABLES_CONFIG: IMainPageConfig = {
  title: 'Payables',
  subtitle:
    'Manage all your outgoing payments, vendors, bills, and payroll in one place',
  apiCards: [
    {
      icon: Send,
      label: 'Total Sent',
      value: '--',
      subtitle: 'Last 30 days',
      subtitleColor: 'var(--v4-primary-brand-bold-color)',
      iconBgColor: 'var(--v4-common-sky-color)',
      iconColor: 'white'
    },
    {
      icon: Users,
      label: 'Active Vendors',
      value: '--',
      subtitle: '',
      subtitleColor: 'var(--v4-common-green-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    },
    {
      icon: FileText,
      label: 'Pending Bills',
      value: '--',
      subtitle: '',
      subtitleColor: 'var(--v4-common-red-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    },
    {
      icon: CalendarDays,
      label: 'Scheduled Payments',
      value: '--',
      subtitle: 'Next 30 days',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    }
  ],
  ctaBanner: {
    bgColor: 'var(--v4-cta-banner-bg-color)',
    titleColor: 'white',
    subtitleColor: 'rgba(255,255,255,0.8)',
    title: 'Ready to send a payment?',
    subtitle:
      'Send payments to vendors, employees, or anyone with multiple payment methods',
    buttonText: 'Send Payment',
    buttonStyle: 'neon',
    buttonIcon: 'arrow-right',
    buttonIconSize: 16
  },
  featureSections: [
    {
      title: 'Payables Features',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      cards: [
        {
          icon: Send,
          heading: 'Send Payment',
          description:
            'Send payments to vendors, employees, or anyone with multiple payment methods',
          buttonText: 'Send Payment',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          action: 'send-payment'
        },
        {
          icon: Send,
          heading: 'Payments Out',
          description:
            'View all outgoing payment history, track statuses, and download reports',
          buttonText: 'Go to Payments Out',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'payments-out/detailed'
        },
        {
          icon: DollarSign,
          heading: 'Payroll by Credit Card ',
          description:
            'Process payroll, manage salary payments, and maintain payroll records',
          buttonText: 'Go to Payroll by Credit Card',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'payroll-card'
        },
        {
          icon: Users,
          heading: 'Payees',
          description:
            'Manage payees relationships, track payments, and maintain contact information',
          buttonText: 'Go to Payees',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'payee'
        },
        {
          icon: CreditCard,
          heading: 'Bulk Payment Center',
          description:
            'Process 100s of payments at once - manual entry, Excel import, or saved templates',
          buttonText: 'Go to Bulk Payment Center',
          iconBgColor: 'var(--v4-secondary-brand-color)',
          iconColor: 'black',
          routerLink: 'bulk-payments',
          fontIcon:faMoneyBills
        },
        {
          icon: CreditCard,
          heading: 'Issue Visa Card',
          description:
            'Issue virtual and physical Visa cards for your business with full control',
          buttonText: 'Go to Issue Visa Card',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'virtual-card',
          badge: 'FEATURED',
          badgeColor: 'var(--v4-accent-violet-color)'
        },
        {
          icon: Globe,
          heading: 'International Payment',
          description:
            'Send and receive international payments with competitive exchange rates',
          buttonText: 'Go to International Payment',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'international-payment/index'
        },
        {
          icon: FileText,
          heading: 'Bills',
          description:
            'Track and manage incoming bills, set payment schedules, and stay organized',
          buttonText: 'Go to Bills',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'bill/detailed'
        },
        {
          icon: Mail,
          heading: 'Bill Inbox',
          description:
            'Connect your email to turn invoices into payable bills instantly',
          buttonText: 'Go to Bill Inbox',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'bill/inbox'
        },
      ]
    }
  ],
  benefits: {
    heading: `Why Choose ${productName} for Payables?`,
    items: [
      {
        title: 'Multiple Payment Methods',
        description: 'ACH, Wire, Check, and more payment options'
      },
      {
        title: 'Automated Workflows',
        description: 'Schedule payments and automate bill payments'
      },
      {
        title: 'Real-Time Tracking',
        description: 'Monitor payment status and get instant notifications'
      }
    ]
  }
};

export const RECEIVABLES_CONFIG: IMainPageConfig = {
  title: 'Receivables',
  subtitle:
    'Manage all your incoming payments, customers, invoices, and payment collection tools',
  apiCards: [
    {
      icon: TrendingUp,
      label: 'Total Received',
      value: '--',
      subtitle: 'Last 30 days',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-secondary-brand-color)',
      iconColor: 'black'
    },
    {
      icon: Users,
      label: 'Active Customers',
      value: '--',
      subtitle: '',
      subtitleColor: 'var(--v4-common-green-color)',
      iconBgColor: 'var(--v4-common-sky-color)',
      iconColor: 'white'
    },
    {
      icon: FileText,
      label: 'Outstanding Invoices',
      value: '--',
      subtitle: '',
      subtitleColor: 'var(--v4-common-red-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    },
    {
      icon: Link2,
      label: 'Payment Links',
      value: '--',
      subtitle: 'Active links',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    }
  ],
  ctaBanner: {
    bgColor: 'var(--v4-cta-banner-bg-color)',
    titleColor: 'white',
    subtitleColor: 'rgba(255,255,255,0.8)',
    title: 'Ready to receive a payment?',
    subtitle:
      'Collect payments from customers instantly with multiple payment options',
    buttonText: 'Receive Payment',
    buttonStyle: 'neon',
    buttonIcon: 'arrow-right',
    buttonIconSize: 16
  },
  featureSections: [
    {
      title: 'Receivables Features',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      cards: [
        {
          icon: Receipt,
          heading: 'Receive Payment',
          description:
            'Accept payments from customers through checks, ACH, and other payment methods',
          buttonText: 'Receive Payment',
          iconBgColor: 'var(--v4-secondary-brand-color)',
          iconColor: 'black',
          action: 'receive-payment'
        },
        {
          icon: Receipt,
          heading: 'Payments In',
          description:
            'View and manage all incoming payments and their transaction statuses',
          buttonText: 'Go to Payments In',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'payments-in/detailed'
        },
        {
          icon: Users,
          heading: 'Customers',
          description:
            'Manage your customer contacts, payment details, and transaction history',
          buttonText: 'Go to Customers',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'payees',
          queryParams: { type: 'customer' }
        },
        {
          icon: Banknote,
          heading: 'Check Draft',
          description:
            'Create and manage check drafts for receiving payments from customers',
          buttonText: 'Go to Check Draft',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'checkdraft/index'
        },
        {
          icon: Link2,
          heading: 'Payment Link',
          description:
            'Generate shareable payment links to collect payments online easily',
          buttonText: 'Go to Payment Link',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'payment-links'
        },
        {
          icon: FileText,
          heading: 'Invoice',
          description:
            'Create, send, and track invoices to get paid faster by your customers',
          buttonText: 'Go to Invoice',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'invoice',
          queryParams: { tab: 'detailed' }
        },
      ]
    }
  ],
  benefits: {
    heading: `Why Choose ${productName} for Receivables?`,
    items: [
      {
        title: 'Fast Payment Collection',
        description: 'Accept payments via ACH, checks, payment links, and more'
      },
      {
        title: 'Professional Invoicing',
        description: 'Create and send branded invoices to get paid faster'
      },
      {
        title: 'Payment Tracking',
        description:
          'Monitor all incoming payments with real-time status updates'
      }
    ]
  }
};

export const BUSINESS_TOOLS_CONFIG: IMainPageConfig = {
  title: 'Business Tools',
  subtitle:
    'Powerful tools to streamline your business operations and financial management',
  apiCards: [
    {
      icon: Wallet,
      label: 'Total Expenses',
      value: '',
      subtitle: '',
      subtitleColor: 'var(--v4-text-success)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white',
      comingSoon: true
    },
    {
      icon: FileBox,
      label: 'Deposit Slips',
      value: '',
      subtitle: '',
      subtitleColor: 'var(--v4-text-success)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white',
      comingSoon: true
    },
    {
      icon: Mail,
      label: 'Sent Documents',
      value: '',
      subtitle: '',
      subtitleColor: 'var(--v4-text-success)',
      iconBgColor: 'var(--v4-common-sky-color)',
      iconColor: 'white',
      comingSoon: true
    },
    {
      icon: TrendingUp,
      label: 'Time Saved',
      value: '',
      subtitle: '',
      subtitleColor: 'var(--v4-text-success)',
      iconBgColor: 'var(--v4-secondary-brand-color)',
      iconColor: 'black',
      comingSoon: true
    }
  ],
  ctaBanner: {
    bgColor: 'var(--v4-cta-banner-bg-color)',
    titleColor: 'white',
    subtitleColor: 'rgba(255,255,255,0.8)',
    title: 'Exciting Tools Coming Soon!',
    subtitle:
      'We are working on powerful business tools to help you manage expenses, deposits, and documents more efficiently',
    buttonText: '',
    buttonStyle: '',
    icon: Clock
  },
  featureSections: [
    {
      title: 'Available Tools',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      cards: [
        {
          icon: Wallet,
          heading: 'Cash Expense',
          description:
            'Track and manage cash expenses, record transactions, and maintain expense records',
          buttonText: 'Go to Cash Expense',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'cashexp/index'
        },
        {
          icon: FileBox,
          heading: 'Deposit Slip',
          description:
            'Generate deposit slips for bank deposits and maintain accurate records',
          buttonText: 'Go to Deposit Slip',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'depositslips/index'
        },
        {
          icon: Mail,
          heading: 'Mail Document',
          description:
            'Send important business documents securely via mail with tracking',
          buttonText: 'Go to Mail Document',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'business-tools/document-mail'
        }
      ]
    }
  ],
  benefits: {
    heading: 'What to Expect from Business Tools',
    items: [
      {
        title: 'Streamlined Operations',
        description: 'Manage daily business tasks with ease and efficiency'
      },
      {
        title: 'Accurate Record Keeping',
        description: 'Maintain precise records of all business transactions'
      },
      {
        title: 'Time-Saving Automation',
        description: 'Automate routine tasks and focus on growing your business'
      }
    ]
  }
};

export const ACCOUNTS_CONFIG: IMainPageConfig = {
  title: 'Accounts',
  subtitle:
    'Manage all your financial accounts, cards, wallets, and banking services in one secure place',
  apiCards: [
    // Total Balance commented out — not yet available from API
    // {
    //   icon: DollarSign,
    //   label: 'Total Balance',
    //   value: '--',
    //   subtitle: 'Across all accounts',
    //   subtitleColor: 'var(--v4-secondary-text-color)',
    //   iconBgColor: 'var(--v4-primary-brand-color)',
    //   iconColor: 'white'
    // },
    {
      icon: Building2,
      label: 'Connected Accounts',
      value: '--',
      subtitle: 'All active',
      subtitleColor: 'var(--v4-text-success)',
      iconBgColor: 'var(--v4-common-sky-color)',
      iconColor: 'white'
    },
    {
      icon: Wallet,
      label: 'Wallet Balance',
      value: '--',
      subtitle: 'Free transactions',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    },
    {
      icon: CreditCard,
      label: 'Active Cards',
      value: '--',
      subtitle: 'Credit & Debit',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    }
  ],
  ctaBanner: {
    bgColor: 'var(--v4-cta-banner-bg-color)',
    titleColor: 'white',
    subtitleColor: 'rgba(255,255,255,0.8)',
    title: 'All Your Accounts in One Place',
    subtitle:
      'Connect bank accounts, manage cards, and access your digital wallet for seamless financial management',
    buttonText: '',
    buttonStyle: 'neon',
    buttonDisabled: true
  },
  featureSections: [
    {
      title: 'Account Management Features',
      customTemplate: true,
      gridClass:
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4',
      cards: [
        {
          icon: Building2,
          heading: 'Bank Accounts',
          description:
            'Connect and manage your bank accounts, view balances, and track transactions',
          buttonText: 'Go to Bank Accounts',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'bank-accounts/index'
        },
        {
          icon: CreditCard,
          heading: 'My Cards',
          description:
            'Manage your credit and debit cards, track spending, and control card settings',
          buttonText: 'Go to My Cards',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'cards'
        },
        {
          icon: Wallet,
          heading: 'Wallets',
          description:
            "Keep a funded balance that's ready to send the moment you need to pay.",
          buttonText: 'Go to Wallets',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'wallets'
        },
        {
          icon: Database,
          heading: 'Bank Data',
          description:
            'Analyze your banking data with advanced insights and reporting tools',
          buttonText: 'Go to Bank Data',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'v4-business-tools/bank-data/overview'
        }
      ]
    }
  ],
  benefits: {
    heading: `Why Manage Accounts with ${productName}?`,
    items: [
      {
        icon: CircleCheck,
        title: 'Unified Dashboard',
        description: 'View all your accounts and balances in one place'
      },
      {
        icon: Shield,
        title: 'Bank-Level Security',
        description: 'Your accounts are protected with advanced encryption'
      },
      {
        icon: Zap,
        title: 'Instant Transfers',
        description: 'Move money between accounts instantly'
      }
    ]
  }
};

export const SERVICES_CONFIG: IMainPageConfig = {
  title: 'Services',
  subtitle:
    'Premium business services and integrations to scale your operations',
  apiCards: [],
  ctaBanner: {
    bgColor: 'var(--v4-cta-banner-bg-color)',
    titleColor: 'white',
    subtitleColor: 'rgba(255,255,255,0.8)',
    title: 'Issue Business Visa Cards',
    subtitle:
      'Get virtual and physical Visa cards for your team with full spending controls',
    buttonText: 'Get Started',
    buttonStyle: 'neon',
    buttonIcon: 'arrow-right',
    buttonIconSize: 16,
    badge: {
      text: 'NOW AVAILABLE',
      bgColor: 'var(--v4-secondary-brand-color)',
      textColor: 'black'
    }
  },
  featureSections: [
    {
      title: 'Available Services',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      customTemplate: true,
      cards: [
        {
          icon: Layers,
          heading: 'App Integrations',
          description:
            'Connect with QuickBooks, Xero, and other accounting software seamlessly',
          buttonText: 'Go to App Integrations',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'thirdparty_app/index'
        },
        {
          icon: Package,
          heading: 'Marketplace',
          description:
            'Access business services, vendors, and financial products in one place',
          buttonText: 'Coming Soon',
          iconBgColor: 'var(--v4-secondary-brand-color)',
          iconColor: 'black',
          comingSoon: true
        },
        {
          icon: Database,
          heading: 'Bank Data',
          description:
            'Analyze your banking data with advanced insights and reporting tools',
          buttonText: 'Go to Bank Data',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'v4-business-tools/bank-data/overview'
        }
      ]
    }
  ],
  benefits: {
    heading: `Why Choose ${productName} Services?`,
    items: [
      {
        icon: CircleCheck,
        title: 'Seamless Integration',
        description:
          'Connect with your favorite tools and platforms effortlessly'
      },
      {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Bank-level security for all your business services'
      },
      {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Quick setup and instant access to services'
      }
    ]
  }
};

export const SETTINGS_CONFIG: IMainPageConfig = {
  title: 'Settings',
  subtitle:
    'Customize your account, manage preferences, and configure security settings',
  apiCards: [
    {
      icon: CircleCheck,
      label: 'Account Status',
      value: '--',
      valueColor: 'var(--v4-common-green-color)',
      subtitle: 'All systems operational',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-secondary-brand-color)',
      iconColor: 'black'
    },
    {
      icon: Shield,
      label: 'Security Level',
      value: '--',
      subtitle: '',
      subtitleColor: 'var(--v4-text-success)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    },
    {
      icon: Users,
      label: 'Team Members',
      value: '--',
      subtitle: 'Active users',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    },
    {
      icon: Bell,
      label: 'Notifications',
      value: '--',
      subtitle: 'Unread alerts',
      subtitleColor: 'var(--v4-secondary-text-color)',
      iconBgColor: 'var(--v4-primary-brand-color)',
      iconColor: 'white'
    }
  ],
  featureSections: [
    {
      title: 'Account Settings',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      cards: [
        {
          icon: User,
          heading: 'Profile Settings',
          description:
            'Update your personal information, contact details, and profile picture',
          buttonText: 'Configure',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'user-profile'
        },
        {
          icon: Lock,
          heading: 'Security & Privacy',
          description:
            'Manage passwords, two-factor authentication, and privacy settings',
          buttonText: 'Configure',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'user-profile',
          queryParams: { tab: 'security' }
        },
        {
          icon: Bell,
          heading: 'Notifications',
          description:
            'Configure email, push, and SMS notification preferences',
          buttonText: 'Configure',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'user-profile/user-settings',
          queryParams: { tab: 'notification' }
        }
      ]
    },
    {
      title: 'Business Settings',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      cards: [
        {
          icon: Users,
          heading: 'User Management',
          description:
            'Invite team members, assign roles, and manage permissions',
          buttonText: 'Manage',
          iconBgColor: 'var(--v4-secondary-brand-color)',
          iconColor: 'black',
          routerLink: 'manage-users/index'
        },
        {
          icon: CreditCard,
          heading: 'Payment Methods',
          description:
            'Add and manage credit cards, bank accounts, and payment options',
          buttonText: 'Manage',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          action: 'send-payment'
        },
        {
          icon: Mail,
          heading: 'Email Preferences',
          description: 'Customize email templates and communication settings',
          buttonText: 'Manage',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'user-profile/user-settings',
          queryParams: { tab: 'email-settings' }
        }
      ]
    },
    {
      title: 'App Settings',
      gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      cards: [
        {
          icon: Settings,
          heading: 'Application Settings',
          description:
            'Configure general settings, notifications, email templates, and advanced options',
          buttonText: 'Customize',
          iconBgColor: 'var(--v4-primary-brand-color)',
          iconColor: 'white',
          routerLink: 'user-profile/user-settings'
        },
        {
          icon: Globe,
          heading: 'Language & Region',
          description: 'Set your preferred language, timezone, and currency',
          buttonText: 'Customize',
          iconBgColor: 'var(--v4-common-sky-color)',
          iconColor: 'white',
          routerLink: 'user-profile/user-settings'
        }
      ]
    }
  ]
};
