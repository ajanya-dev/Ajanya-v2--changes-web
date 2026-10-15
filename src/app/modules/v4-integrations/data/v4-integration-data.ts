import { IIntgrationApps } from 'src/app/modules/integration/model/integration';
import { Integration } from 'src/app/data/data/integration';

export type V4IntegrationCategory =
  | 'Accounting'
  | 'Payroll'
  | 'Finance'
  | 'CRM'
  | 'Ticketing'
  | 'Marketing'
  | 'ATS'
  | 'Others';

export interface IV4IntegrationSupport {
  email: string;
  phone?: string;
  liveChatEnabled: boolean;
}

export interface IV4IntegrationApp extends IIntgrationApps {
  description: string;
  overviewDescription?: string;
  categories: V4IntegrationCategory[];
  features: string[];
  instructions: string[];
  actions?: string[];
  supportedCheckTypes?: string[];
  additionalFeatures?: string[];
  support: IV4IntegrationSupport;
  isConnected?: boolean;
}

interface V4AppMetadata {
  description: string;
  overviewDescription?: string;
  categories: V4IntegrationCategory[];
  features?: string[];
  instructions?: string[];
  actions?: string[];
  supportedCheckTypes?: string[];
  additionalFeatures?: string[];
  support?: IV4IntegrationSupport;
  preventAccessToWhiteLabels?: boolean;
}

/**
 * Metadata map keyed by Angular app id from Integration.integrationLinks().
 * Descriptions and categories ported from the React apps-registry.
 */
const V4_APP_METADATA: Record<string, V4AppMetadata> = {
  // Active - Accounting
  'qb-online': {
    description:
      'Sync your transactions, invoices, and bills with QuickBooks Online automatically. Two-way sync keeps your data up-to-date across both platforms.',
    categories: ['Accounting'],
    features: [
      'Automatic transaction sync',
      'Invoice and bill synchronization',
      'Real-time expense tracking',
      'Vendor and customer data sync',
      'Account reconciliation'
    ],
    instructions: [
      'Click on "Connect."',
      'Authenticate using your QuickBooks credentials.',
      'Select "Import" and choose QuickBooks. Import checks, bills, or invoices effortlessly.'
    ]
  },
  'qb-desktop': {
    description:
      'Connect QuickBooks Desktop for seamless data synchronization. Import bills, track payments, and manage accounting in real-time.',
    categories: ['Accounting'],
    features: [
      'Desktop application sync',
      'Local data integration',
      'Bill and invoice import',
      'Payment tracking',
      'Multi-company support'
    ],
    instructions: [
      'Download the integration file.',
      'Add the downloaded file to QuickBooks desktop Web Connector.',
      'Import QuickBooks checks from your check list.'
    ],
    supportedCheckTypes: [
      'Payroll Checks',
      'Regular Checks',
      'Bill Paid by Checks',
      'Credit Memo Checks'
    ],
    additionalFeatures: [
      'Process all payments in your own way',
      'Print multiple bank account checks to one blank check stock.',
      'Print checks on plain white paper',
      'Send ACH or Direct Deposit',
      'Email/Text one-time Printable PDF checks'
    ]
  },
  zoho: {
    description:
      'Online accounting software for small businesses. Manage invoices, expenses, inventory, and get real-time business insights.',
    categories: ['Accounting'],
    features: [
      'Invoice and expense management',
      'Inventory tracking',
      'Bank reconciliation',
      'Project billing',
      'Client portal access'
    ],
    instructions: [
      'Click on Connect',
      'Authenticate with your Zoho Books credentials',
      'Click on Import Companies',
      'Select the companies and click on Start Importing'
    ]
  },
  'Zoho-payroll': {
    description: 'Sync payroll data from Zoho Payroll',
    categories: ['Payroll'],
    features: [
      'Payroll check import',
      'Employee data sync',
      'Payroll schedule management'
    ],
    instructions: [
      'Click on Connect',
      'Authenticate with Zoho Payroll credentials',
      'Click on Import Companies',
      'Click on view icon to see payroll details',
      'Click on download icon to import checks'
    ]
  },
  'quickbooks-payroll': {
    description:
      'Import payroll runs from QuickBooks Online Payroll and create payroll checks for every company you connect.',
    categories: ['Payroll'],
    features: [
      'Payroll check import',
      'Contractor payment import',
      'Multiple company support'
    ],
    instructions: [
      'Click on Connect',
      'Authenticate with QuickBooks Online Payroll credentials',
      'All companies from QuickBooks Online Payroll will be listed',
      'Click on view to see the payrolls',
      'Click on create check to import checks from each payroll'
    ]
  },
  'qb-payroll': {
    description:
      'Upload or paste payroll data to automatically create payroll checks from any payroll system including QuickBooks, Zoho, and more.',
    overviewDescription:
      'Drag and drop or paste payroll data and automatically generate payroll checks from QuickBooks, Zoho, and other payroll systems.',
    categories: ['Payroll'],
    features: ['Payroll check import', 'Employee payment tracking']
  },
  gusto: {
    description:
      'Modern payroll, benefits, and HR platform. Automate payroll runs, tax filings, and employee benefits seamlessly.',
    categories: ['Payroll'],
    features: [
      'Full-service payroll',
      'Automated tax filing',
      'Health benefits integration',
      'Time and attendance tracking',
      'New hire reporting'
    ],
    instructions: [
      'Click on Connect',
      'Authenticate with Gusto credentials',
      'All companies from Gusto will be listed',
      'Click on view to see the payrolls',
      'Click on create check to import checks from each payroll'
    ]
  },
  zapier: {
    description:
      'Zapier helps you automate repetitive tasks between two or more apps without coding. When an event happens in one application, Zapier can tell another application to perform a particular action. Connect Zapier to integrate your favorite apps with your account.',
    categories: ['Others'],
    features: [
      'Connect with 5,000+ apps',
      'Automate repetitive tasks without coding',
      'Trigger actions across applications'
    ],
    instructions: [
      'Click on Connect Now',
      'Create a new Zap and set the trigger',
      'Select Online Check Writer to set action',
      'Connect with your Online Check Writer account',
      'Match the fields from your trigger application'
    ],
    actions: [
      'Create Check',
      'Create Check and Mail Check',
      'Create Check and Email Check',
      'Save Get Paid by Form Details'
    ]
  },
  'trust-books': {
    description: 'Convert your payroll PDFs into printable checks',
    categories: ['Others']
  },
  'check-from-pdf': {
    description:
      'Generate checks from any PDF document. Upload invoices, bills, or any PDF document and instantly generate print-ready checks.',
    categories: ['Others'],
    features: ['Connect and sync data', 'Automate workflows'],
    instructions: [
      'Select the bank account to issue the check',
      'Choose a signature option and payroll type',
      'Upload the PDF downloaded from a third-party application'
    ]
  },
  xero: {
    description:
      'Connect Zilmoney with Xero for seamless accounting automation. Sync payments, invoices, and financial data in real-time.',
    categories: ['Accounting'],
    features: [
      'Two-way transaction sync',
      'Invoice and payment tracking',
      'Bank reconciliation',
      'Multi-currency support',
      'Automated expense categorization'
    ],
    instructions: [
      'Click on connect',
      'Authenticate with your Xero credentials',
      'Click on Import checks to Import the check',
      'Click on Import Bills to Import the Bills'
    ]
  },
  bill: {
    description:
      'Accounts payable and receivable automation. Streamline bill payments, approvals, and vendor management workflows.',
    categories: ['Accounting'],
    features: [
      'AP automation',
      'Electronic payments',
      'Approval workflows',
      'Vendor management',
      'Digital document storage'
    ],
    instructions: [
      'Click on "Connect Bill.com"',
      'Authenticate with your Bill.com user name and password'
    ]
  },
  freshbook: {
    description:
      'Simple and intuitive accounting for small businesses. Automatically sync invoices, expenses, and payments.',
    categories: ['Accounting'],
    features: [
      'Invoice syncing',
      'Expense tracking',
      'Time tracking integration',
      'Client data sync',
      'Payment status updates'
    ],
    instructions: [
      'Click on Connect FreshBooks.',
      'Authenticate with your FreshBooks credentials.'
    ]
  },
  'sage-business': {
    description:
      'Enterprise-grade accounting integration with Sage. Perfect for growing businesses with complex accounting needs.',
    categories: ['Accounting'],
    features: [
      'Advanced financial reporting',
      'Multi-entity accounting',
      'Dimension-based accounting',
      'Automated GL posting',
      'Custom field mapping'
    ],
    instructions: [
      'Click on connect',
      'Authenticate with your sage business credentials'
    ]
  },
  adp: {
    description: 'Use credit card to pay payroll',
    categories: ['Payroll']
  },
  wave: {
    description:
      'Free accounting software for small businesses. Manage invoicing, payments, and accounting with no subscription fees.',
    categories: ['Accounting'],
    features: [
      'Free accounting software',
      'Invoice and receipt management',
      'Payment processing',
      'Financial reporting',
      'Bank connection sync'
    ],
    instructions: [
      'Click on connect',
      'Authenticate with your Wave credentials',
      'Click on Import Invoice to Import the invoice'
    ]
  },
  netsuite: {
    description:
      'Complete cloud ERP solution for enterprise accounting. Manage financials, operations, and reporting in one unified system.',
    categories: ['Accounting'],
    features: [
      'ERP integration',
      'Multi-subsidiary management',
      'Advanced financial consolidation',
      'Revenue recognition',
      'Real-time business intelligence'
    ],
    instructions: [
      'Click on connect',
      'Authenticate with your NetSuite credentials'
    ]
  },
  square: {
    description: 'Sync customers, vendors, and employees from your Square account.',
    categories: ['Finance'],
    features: [
      'Import customers from Square',
      'Import vendors from Square',
      'Import employees from Square'
    ],
    instructions: [
      'Click "Connect" to authorize with your Square credentials',
      'Once connected, use the import buttons to sync your data'
    ],
    support: { email: 'support@onlinecheckwriter.com', liveChatEnabled: true },
    preventAccessToWhiteLabels: true
  },
  odoo: {
    description:
      'Open-source ERP with comprehensive business management. Sync accounting, inventory, sales, and operations data effortlessly.',
    categories: ['Accounting'],
    features: [
      'Modular ERP integration',
      'Accounting and invoicing sync',
      'Inventory management',
      'Sales and purchase orders',
      'Custom module support'
    ],
    instructions: [
      'Click on connect',
      'Authenticate with your Odoo credentials'
    ]
  },
  salesforce: {
    description:
      'CRM and service cloud platform. Sync contacts and issue checks directly from your Salesforce data.',
    categories: ['CRM', 'Ticketing'],
    features: [
      'Multi-account support',
      'Contact sync from Salesforce',
      'Issue checks from contacts',
      'Paginated contact browsing',
      'Individual account disconnect'
    ],
    instructions: [
      'Click on "Connect"',
      'Authenticate with your Salesforce credentials',
      'Select an account to view contacts',
      'Click "Sync Contacts" to import contacts',
      'Click "Issue Check" on a contact to create a payment'
    ]
  },
  slack: {
    description:
      'Connect Slack to sync your workspace members and issue checks directly to employees. Keep your payment workflows aligned with your team communication platform.',
    categories: ['Others'],
    features: [
      'Connect your Slack workspace via OAuth',
      'Sync employees from your Slack workspace',
      'Issue checks directly to workspace members',
      'Auto-create payees for employees'
    ],
    instructions: [
      'Click "Connect" to authorize OnlineCheckWriter with your Slack workspace.',
      'Once connected, click "Sync Employees" to import workspace members.',
      'Use "Issue Check" next to any employee to create a payee and issue a check.'
    ]
  },
  hubspot: {
    description:
      'Connect HubSpot to sync your CRM data, including companies, contacts, and deals. Keep your payment workflows in sync with your sales pipeline.',
    categories: ['CRM'],
    features: [
      'Company data sync from HubSpot',
      'Multi-workspace support',
      'Real-time connection status',
      'Paginated company browsing',
      'Individual workspace disconnect'
    ],
    instructions: [
      'Click on "Connect HubSpot"',
      'Authenticate with your HubSpot credentials',
      'Click "Import Companies" to sync data from HubSpot',
      'View imported companies in the table below',
      'Click "Disconnect" to remove the HubSpot integration'
    ]
  },
  clio: {
    description:
      'Connect Clio to sync your legal practice contacts. Keep your payment workflows in sync with your legal management system.',
    categories: ['Others'],
    features: [
      'Contact data sync from Clio',
      'Multi-workspace support',
      'Real-time connection status',
      'Paginated contact browsing',
      'Individual workspace disconnect'
    ],
    instructions: [
      'Click on "Connect Clio"',
      'Authenticate with your Clio credentials',
      'Click "Import Contacts" to sync contacts from Clio',
      'View imported contacts in the table below',
      'Click "Disconnect" to remove the Clio integration'
    ]
  },
  jobber: {
    description: 'Field service management platform',
    categories: ['Others'],
    features: [
      'Connect your Jobber account via OAuth',
      'Sync field service data with your payment workflows',
      'Manage connected Jobber workspaces'
    ],
    instructions: [
      'Click "Connect" to authorize OnlineCheckWriter with your Jobber account.',
      'Once connected, your Jobber workspace will appear in the Settings tab.',
      'Click "Disconnect" to remove the Jobber integration.'
    ]
  },
  shopify: {
    description:
      'Connect your Shopify stores to pull customers into OnlineCheckWriter. Pay and reimburse the people you already sell to without re-keying their details.',
    categories: ['Others'],
    features: [
      'Per-store OAuth connection',
      'Multi-store support',
      'Customer import into payees',
      'Real-time connection status',
      'Individual store disconnect'
    ],
    instructions: [
      'Click "Connect" and enter the store domain you want to authorize.',
      'Authenticate with your Shopify credentials.',
      'Use "Import Customers" to pull customers from a connected store.',
      'Click "Disconnect" on a store to remove it, or "Disconnect" on top to remove all.'
    ]
  },
  dayforce: {
    description: 'HCM and workforce management',
    categories: ['Payroll']
  },

  // Coming Soon - Accounting
  microsoft: {
    description: 'Enterprise business applications',
    categories: ['Accounting']
  },
  'sage-intact': {
    description: 'Cloud financial management',
    categories: ['Accounting']
  },
  clearbooks: {
    description: 'UK accounting software integration',
    categories: ['Accounting']
  },
  freeagent: {
    description: 'UK small business accounting',
    categories: ['Accounting']
  },
  sap: {
    description: 'Enterprise resource planning',
    categories: ['Accounting']
  },
  acumatica: {
    description: 'Cloud ERP software',
    categories: ['Accounting']
  },
  moneybird: {
    description: 'Dutch accounting software',
    categories: ['Accounting']
  },
  exact: {
    description: 'Business software for SMEs',
    categories: ['Others']
  },

  // Coming Soon - Finance
  paypal: {
    description: 'Online payment platform',
    categories: ['Finance']
  },
  stripe: {
    description: 'Payment processing platform',
    categories: ['Finance']
  },
  bitpay: {
    description: 'Cryptocurrency payment processor',
    categories: ['Finance']
  },

  // Coming Soon - Payroll
  workday: {
    description: 'Enterprise HR, finance, and talent management',
    categories: ['Payroll', 'ATS']
  },
  paylocity: {
    description: 'Cloud-based payroll',
    categories: ['Payroll']
  },
  deel: {
    description: 'Global payroll platform',
    categories: ['Payroll']
  },
  factorial: {
    description: 'HR software',
    categories: ['Payroll']
  },
  paychex: {
    description: 'Payroll and HR services',
    categories: ['Payroll']
  },
  proliant: {
    description: 'HR and payroll software',
    categories: ['Payroll']
  },
  rippling: {
    description: 'Workforce management',
    categories: ['Payroll']
  },
  'sap-success-factors': {
    description: 'HR management and talent acquisition suite',
    categories: ['Payroll', 'ATS']
  },
  trinet: {
    description: 'HR solutions for SMBs',
    categories: ['Payroll']
  },
  'ukg-pro': {
    description: 'HR and workforce management',
    categories: ['Payroll']
  },
  'ukg-ready': {
    description: 'HR and payroll solution',
    categories: ['Payroll']
  },
  bamboohr: {
    description: 'HR software for SMBs',
    categories: ['Payroll']
  },
  justworks: {
    description: 'HR, benefits, and payroll',
    categories: ['Payroll']
  },
  hibob: {
    description: 'Modern HR platform',
    categories: ['Payroll']
  },
  okta: {
    description: 'Identity management',
    categories: ['Payroll']
  },
  'azure-ad': {
    description: 'Microsoft identity platform',
    categories: ['Payroll']
  },

  // Coming Soon - CRM
  pipedrive: {
    description: 'Sales CRM',
    categories: ['CRM']
  },
  'dynamics-sales': {
    description: 'Enterprise CRM',
    categories: ['CRM']
  },
  'zendesk-sell': {
    description: 'Sales CRM software',
    categories: ['CRM']
  },
  'zoho-crm': {
    description: 'Sales and marketing CRM',
    categories: ['CRM']
  },
  copper: {
    description: 'CRM for Google Workspace',
    categories: ['CRM']
  },
  keap: {
    description: 'Small business CRM and marketing',
    categories: ['CRM', 'Marketing']
  },
  'teamwork-crm': {
    description: 'Project-based CRM',
    categories: ['CRM']
  },
  freshsales: {
    description: 'Sales CRM by Freshworks',
    categories: ['CRM']
  },
  'active-campaign': {
    description: 'Marketing automation and CRM',
    categories: ['CRM', 'Marketing']
  },
  capsule: {
    description: 'Simple online CRM',
    categories: ['CRM']
  },

  // Coming Soon - Ticketing
  asana: {
    description: 'Work management platform',
    categories: ['Ticketing']
  },
  jira: {
    description: 'Issue and project tracking',
    categories: ['Ticketing']
  },
  zendesk: {
    description: 'Customer service platform',
    categories: ['Ticketing']
  },
  intercom: {
    description: 'Customer messaging platform',
    categories: ['Ticketing']
  },
  servicenow: {
    description: 'IT service management',
    categories: ['Ticketing']
  },
  'azure-devops': {
    description: 'Development collaboration',
    categories: ['Ticketing']
  },
  freshdesk: {
    description: 'Customer support software',
    categories: ['Ticketing']
  },
  ironclad: {
    description: 'Contract lifecycle management',
    categories: ['Ticketing']
  },
  'jira-service': {
    description: 'IT service desk',
    categories: ['Ticketing']
  },
  linear: {
    description: 'Issue tracking tool',
    categories: ['Ticketing']
  },
  'zoho-desk': {
    description: 'Help desk software',
    categories: ['Ticketing']
  },

  // Coming Soon - Marketing
  'customer-io': {
    description: 'Marketing automation',
    categories: ['Marketing']
  },
  klaviyo: {
    description: 'Email marketing platform',
    categories: ['Marketing']
  },
  mailchimp: {
    description: 'Email marketing service',
    categories: ['Marketing']
  },
  messagebird: {
    description: 'Omnichannel communication',
    categories: ['Marketing']
  },
  podium: {
    description: 'Customer communication',
    categories: ['Marketing']
  },
  sendinblue: {
    description: 'Marketing platform',
    categories: ['Marketing']
  },
  getresponse: {
    description: 'Email marketing software',
    categories: ['Marketing']
  },
  'hubspot-marketing': {
    description: 'Connect with Hubspot Marketing Hub',
    categories: ['Marketing']
  },
  hubspot_marketing: {
    description: 'Connect with Hubspot Marketing Hub',
    categories: ['Marketing']
  },

  // Coming Soon - ATS
  greenhouse: {
    description: 'Recruiting software',
    categories: ['ATS']
  },
  lever: {
    description: 'Recruiting platform',
    categories: ['ATS']
  },
  jobvite: {
    description: 'Talent acquisition suite',
    categories: ['ATS']
  },
  icims: {
    description: 'Talent cloud platform',
    categories: ['ATS']
  },
  'oracle-taleo': {
    description: 'Enterprise talent management',
    categories: ['ATS']
  }
};

const DEFAULT_SUPPORT: IV4IntegrationSupport = {
  email: 'support@onlinecheckwriter.com',
  phone: '(408) 775-7720',
  liveChatEnabled: true
};

const DEFAULT_METADATA: V4AppMetadata = {
  description: '',
  categories: ['Others'],
  features: ['Connect and sync data', 'Automate workflows']
};

/**
 * Gets the full v4 integration apps list by enriching the existing
 * Integration.integrationLinks() data with descriptions, categories, and colors.
 */
export function getV4IntegrationApps(): IV4IntegrationApp[] {
  const baseApps = Integration.integrationLinks();
  return baseApps.map((app) => {
    const meta = V4_APP_METADATA[app.id] ?? DEFAULT_METADATA;
    return {
      ...app,
      description: meta.description || `Connect with ${app.title}`,
      overviewDescription: meta.overviewDescription,
      categories: meta.categories,
      features: meta.features ?? DEFAULT_METADATA.features ?? [],
      instructions: meta.instructions ?? [],
      actions: meta.actions,
      supportedCheckTypes: meta.supportedCheckTypes,
      additionalFeatures: meta.additionalFeatures,
      support: meta.support ?? DEFAULT_SUPPORT
    };
  });
}

/**
 * Filter apps by category. Supports multi-category apps.
 */
export function filterByCategory(
  apps: IV4IntegrationApp[],
  category: V4IntegrationCategory
): IV4IntegrationApp[] {
  return apps.filter((app) => app.categories.includes(category));
}

/** All UI category options */
export const V4_CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Accounting', label: 'Accounting' },
  { value: 'Payroll', label: 'Payroll' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Ticketing', label: 'Ticketing' },
  { value: 'CRM', label: 'CRM' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'ATS', label: 'ATS' },
  { value: 'Others', label: 'Others' }
];

/** Map category to background hex color (Tailwind custom palette doesn't include standard colors) */
export function getCategoryBgColor(category: V4IntegrationCategory): string {
  const colors: Record<V4IntegrationCategory, string> = {
    Accounting: 'var(--v4-accent-violet-color)',
    Payroll: 'var(--v4-common-blue-color)',
    Finance: 'var(--v4-common-green-color)',
    Ticketing: 'var(--v4-common-yellow-color)',
    CRM: 'var(--v4-common-sky-color)',
    Marketing: 'var(--v4-common-red-color)',
    ATS: 'var(--v4-common-violet-color)',
    Others: 'var(--v4-badge-neutral-text-color)'
  };
  return colors[category] || 'var(--v4-badge-neutral-text-color)';
}
