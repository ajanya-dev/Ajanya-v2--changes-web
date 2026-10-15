import { IIntgrationApps } from 'src/app/modules/integration/model/integration';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { environment } from 'src/environments/environment';

export class Integration {
  static integrationLinks():IIntgrationApps[] {
    return [
      {
        title: 'QuickBooks Online',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/quickbooks_online',
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'qb-online'
      },
      {
        title: 'QuickBooks Desktop',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: IntegrationService.getQBDesktopRoutingLinks(),
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'qb-desktop'
      },
      {
        title: 'Zoho Books',
        icon: '../../../../assets/images/integration/zoho-latest-logo.png',
        routerLink: '/manage/thirdparty_app/zoho/zoho_books',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'zoho'
      },
      {
        title: 'Zoho Payroll',
        icon: '../../../../assets/images/integration/payroll-latest-logo.png',
        routerLink: '/manage/thirdparty_app/zoho/zoho_payroll',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'Zoho-payroll'
      },
      {
        title: 'QuickBooks Online Payroll',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/quickbooks-payroll',
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'quickbooks-payroll'
      },
      {
        title: ' QuickBooks Payroll (Unofficial)',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/payrollcheck',
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'qb-payroll'
      },
      {
        title: 'Gusto',
        icon: '../../../../assets/images/integration/gusto-latest-logo.png',
        routerLink: '/manage/thirdparty_app/gusto',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'gusto'
      },
      {
        title: 'Zapier',
        icon: '../../../../assets/images/integration/zapier-latest-logo.png',
        routerLink: '/manage/thirdparty_app/zapier',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'zapier'
      },
      {
        title: 'TrustBooks',
        icon: '../../../../assets/images/integration/trust_book.png',
        routerLink: '/manage/thirdparty_app/payrollcheck?trust_books=true',
        styles: { display: 'flex', flex: 'none', img: { width: '135px' } },
        id: 'trust-books'
      },
      {
        title: 'Create Check from PDF ',
        icon: '../../../../assets/icon/pdf.svg',
        routerLink: '/manage/thirdparty_app/payrollcheck',
        styles: { display: 'flex', flex: 'none', img: { width: '60px' } },
        id: 'check-from-pdf'
      },
      {
        title: 'Xero',
        icon: '../../../../assets/images/integration/xero.png',
        routerLink: '/manage/thirdparty_app/xero',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'xero'
      },
      {
        title: 'Bill.com',
        icon: '../../../../assets/images/integration/bill-dot-com.png',
        routerLink: '/manage/thirdparty_app/bill-dot-com',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'bill'
      },
      {
        title: 'FreshBooks',
        icon: '../../../../assets/images/integration/freshbook.png',
        routerLink: '/manage/thirdparty_app/freshbooks',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'freshbook'
      },
      {
        title: 'Sage Business Cloud Accounting',
        icon: '../../../../assets/images/integration/sage.png',
        routerLink: '/manage/thirdparty_app/sage-business',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'sage-business'
      },
      {
        title: 'Use Credit Card to Pay Payroll',
        icon: '../../../../assets/images/integration/adp-logo1.png',
        routerLink: '/manage/thirdparty_app/adp/adp-view',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'adp'
      },
      {
        title: 'Wave',
        icon: '../../../../assets/images/integration/wave.png',
        routerLink: '/manage/thirdparty_app/wave',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'wave'
      },
      {
        title: 'Oracle NetSuite',
        icon: '../../../../assets/images/integration/oraclenet.png',
        routerLink: '/manage/thirdparty_app/netsuite',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: false,
        id: 'netsuite',
        preventAccessToWhiteLabels: environment.env_id !== 'compass'
      },
      {
        title: 'Square',
        icon: '/assets/images/integration/square.webp',
        routerLink: '/manage/thirdparty_app/square',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: false,
        id: 'square',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Odoo',
        icon: '/assets/images/integration/odoo.png',
        routerLink: '/manage/thirdparty_app/odoo/main',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: false,
        id: 'odoo',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Salesforce',
        icon: '../../../../assets/images/integration/salesforce.png',
        routerLink: '/manage/thirdparty_app/salesforce',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'salesforce'
      },
      {
        title: 'Slack',
        icon: '../../../../assets/images/integration/slack.png',
        routerLink: '/manage/thirdparty_app/slack',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'slack'
      },
      {
        title: 'Hubspot',
        icon: '../../../../assets/images/integration/hub.png',
        routerLink: '/manage/thirdparty_app/hubspot',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: false,
        id: 'hubspot'
      },
      {
        title: 'Clio',
        icon: '../../../../assets/images/integration/clio.svg',
        routerLink: '/manage/thirdparty_app/clio',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: false,
        id: 'clio'
      },
      {
        title: 'Jobber',
        icon: '../../../../assets/images/integration/jobber.svg',
        routerLink: '',
        //  '/manage/thirdparty_app/jobber',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jobber'
      },
      {
        title: 'Shopify',
        icon: '../../../../assets/images/integration/shopify.svg',
        // V3 opens the Shopify home page (import customers / disconnect); V4
        // ignores `routerLink` and opens the side drawer instead, with
        // thirdPartyV4RedirectGuard bouncing this route back to that drawer.
        // `comingSoon` must remain false or the V4 card opens the
        // request-integration modal instead of the panel.
        routerLink: '/manage/thirdparty_app/shopify',
        styles: { display: 'flex', flex: 'none', img: { width: '60px' } },
        comingSoon: false,
        id: 'shopify'
      },
      {
        title: 'Microsoft Dynamics 365',
        icon: '../../../../assets/images/integration/microsoft.png',
        routerLink: '',
        // routerLink: '/manage/thirdparty_app/microsoft-dynamics-365',
        styles: { display: 'flex', flex: 'none', img: { width: '60px' } },
        comingSoon: true,
        id: 'microsoft',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Sage Intacct',
        icon: '../../../../assets/images/integration/sage.png',
        routerLink: '',
        // routerLink: '/manage/thirdparty_app/sage-intacct',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'sage-intact',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'ClearBooks',
        icon: '../../../../assets/images/integration/clearbooks.png',
        routerLink: '',
        // routerLink: '/manage/thirdparty_app/clearbooks',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'clearbooks',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'FreeAgent',
        icon: '../../../../assets/images/integration/freeagent.png',
        routerLink: '',
        // routerLink: '/manage/thirdparty_app/freeagent',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'freeagent',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Workday',
        icon: '../../../../assets/images/integration/workday.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'workday'
      },
      {
        title: 'SAP',
        icon: '../../../../assets/images/integration/sap.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'sap'
      },
      {
        title: 'BitPay',
        icon: '../../../../assets/images/integration/bitpay.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'bitpay'
      },
      {
        title: 'Paypal',
        icon: '../../../../assets/images/integration/paypal.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'paypal'
      },
      {
        title: 'Stripe',
        icon: '../../../../assets/images/integration/stripe.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'stripe'
      },
      {
        title: 'Exact',
        icon: '../../../../assets/images/integration/exact.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'exact'
      },
      {
        title: 'Acumatica',
        icon: '../../../../assets/images/integration/acumatica.png',
        routerLink: '',
        styles: {
          display: 'flex',
          flex: 'none',
          img: { width: '100px', height: '60px' }
        },
        comingSoon: true,
        id: 'acumatica'
      },
      {
        title: 'Money Bird',
        icon: '../../../../assets/images/integration/moneybird.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'moneybird'
      },
      {
        title: 'Deel',
        icon: '../../../../assets/images/integration/deel.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'deel'
      },
      {
        title: 'Factorial',
        icon: '../../../../assets/images/integration/factorial.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'factorial'
      },
      {
        title: 'Paychex',
        icon: '../../../../assets/images/integration/paychex.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'paychex'
      },
      {
        title: 'Proliant',
        icon: '../../../../assets/images/integration/proliant.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'proliant'
      },
      {
        title: 'Rippling',
        icon: '../../../../assets/images/integration/rippling.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'rippling'
      },
      {
        title: 'SAP Success Factors',
        icon: '../../../../assets/images/integration/sap-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '80px' } },
        comingSoon: true,
        id: 'sapsuccess'
      },
      {
        title: 'Trinet',
        icon: '../../../../assets/images/integration/trinet.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'trinet'
      },
      {
        title: 'UKG Pro',
        icon: '../../../../assets/images/integration/ukgpro.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'ukgpro'
      },
      {
        title: 'UKG Ready',
        icon: '../../../../assets/images/integration/ukg.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'ukgredy'
      },
      {
        title: 'Paylocity',
        icon: '../../../../assets/images/integration/paylocity.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'paylocity'
      },
      {
        title: 'BambooHR',
        icon: '../../../../assets/images/integration/bamboo.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'bambooHr'
      },
      {
        title: 'Justworks',
        icon: '../../../../assets/images/integration/justwork.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'justworks'
      },
      {
        title: 'Hibob',
        icon: '../../../../assets/images/integration/bob.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'hibob'
      },
      {
        title: 'Okta',
        icon: '../../../../assets/images/integration/okta.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'okta'
      },
      {
        title: 'Azure Active Directory',
        icon: '../../../../assets/images/integration/azure.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'azureactive'
      },
      {
        title: 'Greenhouse',
        icon: '../../../../assets/images/integration/green.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'greenhouse'
      },
      {
        title: 'Lever',
        icon: '../../../../assets/images/integration/lever.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'lever'
      },
      {
        title: 'Jobvite',
        icon: '../../../../assets/images/integration/jobvite.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jobvite'
      },
      {
        title: 'ICIMS',
        icon: '../../../../assets/images/integration/icims.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'icims'
      },
      {
        title: 'Oracle Taleo',
        icon: '../../../../assets/images/integration/oracle.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'oracleTaleo'
      },
      {
        title: 'Smart Recruiters',
        icon: '../../../../assets/images/integration/smart.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'smartRecruiters'
      },
      {
        title: 'Cornerstone Talentlink',
        icon: '../../../../assets/images/integration/corner.png',
        routerLink: '',
        styles: {
          display: 'flex',
          flex: 'none',
          img: { width: '120px', height: '45px' }
        },
        comingSoon: true,
        id: 'cornerstone'
      },
      {
        title: 'Talent Reef',
        icon: '../../../../assets/images/integration/talent.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'talentReef'
      },
      {
        title: 'Workable',
        icon: '../../../../assets/images/integration/workable.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'workable'
      },
      {
        title: 'Ashby',
        icon: '../../../../assets/images/integration/ashby.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'ashby'
      },
      {
        title: 'Asana',
        icon: '../../../../assets/images/integration/asana.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'asana'
      },
      {
        title: 'Jira',
        icon: '../../../../assets/images/integration/jira.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jira'
      },
      {
        title: 'Zendesk',
        icon: '../../../../assets/images/integration/zendesk.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'zendesk'
      },
      {
        title: 'Intercom',
        icon: '../../../../assets/images/integration/intercom.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'intercom'
      },
      {
        title: 'Service Now',
        icon: '../../../../assets/images/integration/service.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'serviceNow'
      },
      {
        title: 'Azure DevOps',
        icon: '../../../../assets/images/integration/azuredev.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'azureDevops'
      },
      {
        title: 'Freshdesk',
        icon: '../../../../assets/images/integration/fresh.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'freshdesk'
      },
      {
        title: 'Ironclad',
        icon: '../../../../assets/images/integration/iron.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'ironClad'
      },
      {
        title: 'Jira Service Management',
        icon: '../../../../assets/images/integration/jiraservice.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jiraserviceManagement'
      },
      {
        title: 'Linear',
        icon: '../../../../assets/images/integration/linear.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'linear'
      },
      // {
      //   title: 'Salesforce Service Cloud',
      //   icon: '../../../../assets/images/integration/salesforce.png',
      //   routerLink: '',
      //   styles: { display: 'flex', flex: 'none', img: { width: '60px' } },
      //   comingSoon: true,
      //   id: 'salesforce'
      // },
      {
        title: 'Zoho Desk',
        icon: '../../../../assets/images/integration/zohodesk.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'zohodesk'
      },
      // {
      //   title: 'Hubspot',
      //   icon: '../../../../assets/images/integration/hub.png',
      //   routerLink: '/manage/thirdparty_app/hubspot',
      //   styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
      //   comingSoon: true,
      //   id: 'hubspot'
      // },
      {
        title: 'Pipedrive',
        icon: '../../../../assets/images/integration/pipe.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'pipedrive'
      },
      {
        title: 'Microsoft Dynamics 365 Sales',
        icon: '../../../../assets/images/integration/microsoft-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'microsoftDynamics'
      },
      {
        title: 'Zendesk Sell',
        icon: '../../../../assets/images/integration/zendesk-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'zendeskSell'
      },
      {
        title: 'Zoho CRM',
        icon: '../../../../assets/images/integration/zohocrm.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'zohocrm'
      },
      {
        title: 'Copper',
        icon: '../../../../assets/images/integration/copper.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'copper'
      },
      {
        title: 'Keap',
        icon: '../../../../assets/images/integration/keap.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'keap'
      },
      {
        title: 'Teamwork CRM',
        icon: '../../../../assets/images/integration/teamwork.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'teamwork'
      },
      {
        title: 'Fresh Sales',
        icon: '../../../../assets/images/integration/freshsales.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'freshSales'
      },
      {
        title: 'Active Campaign',
        icon: '../../../../assets/images/integration/active.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'activeCampaign'
      },
      {
        title: 'Capsule',
        icon: '../../../../assets/images/integration/capsule.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'capsule'
      },
      {
        title: 'Customer.io',
        icon: '../../../../assets/images/integration/customer.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'customer'
      },
      {
        title: 'Klaviyo',
        icon: '../../../../assets/images/integration/klavio.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'klaviyo'
      },
      {
        title: 'Mailchimp',
        icon: '../../../../assets/images/integration/mailchimp.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'mailChimp'
      },
      {
        title: 'Message Bird',
        icon: '../../../../assets/images/integration/messagebird.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'messageBird'
      },
      {
        title: 'Podium',
        icon: '../../../../assets/images/integration/podium.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'podium'
      },
      {
        title: 'Sendinblue',
        icon: '../../../../assets/images/integration/sendinblue.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'sendinblue'
      },
      {
        title: 'Get Response',
        icon: '../../../../assets/images/integration/response.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'getResponse'
      },
      {
        title: 'Hubspot Marketing Hub',
        icon: '../../../../assets/images/integration/hub.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'hubspot-marketing'
      }
    ];
  }

  static quickbooksLinks() {
    return [
      {
        title: 'QuickBooks Online',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/quickBooks/quickbooks_online',
        styles: {
          width: '23% ',
          display: 'flex',
          flex: 'none',
          img: { width: '122px' }
        }
      },
      {
        title: 'QuickBooks Desktop',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: IntegrationService.getQBDesktopRoutingLinks(),
        styles: {
          width: '23% ',
          display: 'flex',
          flex: 'none',
          img: { width: '122px' }
        }
      },
      {
        title: ' QuickBooks Payroll (Unofficial)',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/payrollcheck',
        styles: {
          width: '23% ',
          display: 'flex',
          flex: 'none',
          img: { width: '122px' }
        }
      }
    ];
  }

  static accountingLinks() {
    return [
      {
        title: 'QuickBooks Online',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/quickbooks_online',
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'qb-online'
      },
      {
        title: 'QuickBooks Desktop',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: IntegrationService.getQBDesktopRoutingLinks(),
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'qb-desktop'
      },
      {
        title: 'Bill.com',
        icon: '../../../../assets/images/integration/bill-dot-com.png',
        routerLink: '/manage/thirdparty_app/bill-dot-com',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'bill'
      },
      {
        title: 'Zoho Books',
        icon: '../../../../assets/images/integration/zoho-latest-logo.png',
        routerLink: '/manage/thirdparty_app/zoho/zoho_books',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'zoho'
      },
      {
        title: 'Xero',
        icon: '../../../../assets/images/integration/xero.png',
        routerLink: '/manage/thirdparty_app/xero',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'xero'
      },
      {
        title: 'FreshBooks',
        icon: '../../../../assets/images/integration/freshbook.png',
        routerLink: '/manage/thirdparty_app/freshbooks',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'freshbook'
      },
      {
        title: 'Sage Business Cloud Accounting',
        icon: '../../../../assets/images/integration/sage.png',
        routerLink: '/manage/thirdparty_app/sage-business',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'sage-business'
      },
      {
        title: 'Wave',
        icon: '../../../../assets/images/integration/wave.png',
        routerLink: '/manage/thirdparty_app/wave',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'wave'
      },
      {
        title: 'Oracle NetSuite',
        icon: '../../../../assets/images/integration/oraclenet.png',
        routerLink: '/manage/thirdparty_app/netsuite',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: false,
        id: 'netsuite',
        preventAccessToWhiteLabels: environment.env_id !== 'compass'
      },
      {
        title: 'ClearBooks',
        icon: '../../../../assets/images/integration/clearbooks.png',
        routerLink: '/manage/thirdparty_app/clearbooks',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'clearbooks',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'FreeAgent',
        icon: '../../../../assets/images/integration/freeagent.png',
        routerLink: '/manage/thirdparty_app/freeagent',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'freeagent',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Sage Intacct',
        icon: '../../../../assets/images/integration/sage.png',
        routerLink: '/manage/thirdparty_app/sage-intacct',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: false,
        id: 'sage-intact',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Microsoft Dynamics 365',
        icon: '../../../../assets/images/integration/microsoft.png',
        routerLink: '/manage/thirdparty_app/microsoft-dynamics-365',
        styles: { display: 'flex', flex: 'none', img: { width: '60px' } },
        comingSoon: false,
        id: 'microsoft',
        preventAccessToWhiteLabels: true
      },
      {
        title: 'Money Bird',
        icon: '../../../../assets/images/integration/moneybird.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'moneybird'
      },
      {
        title: 'SAP',
        icon: '../../../../assets/images/integration/sap.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'sap'
      },
      {
        title: 'Acumatica',
        icon: '../../../../assets/images/integration/acumatica.png',
        routerLink: '',
        styles: {
          display: 'flex',
          flex: 'none',
          img: { width: '100px', height: '60px' }
        },
        comingSoon: true,
        id: 'acumatica'
      }
    ];
  }

  static financeLinks() {
    return [
      {
        title: 'Paypal',
        icon: '../../../../assets/images/integration/paypal.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'paypal'
      },
      {
        title: 'Stripe',
        icon: '../../../../assets/images/integration/stripe.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'stripe'
      },
      {
        title: 'BitPay',
        icon: '../../../../assets/images/integration/bitpay-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'bitpay'
      }
    ];
  }

  static payrollLinks() {
    return [
      {
        title: 'QuickBooks Online Payroll',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/quickbooks-payroll',
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'quickbooks-payroll'
      },
      {
        title: ' QuickBooks Payroll (Unofficial)',
        icon: '../../../../assets/images/integration/qb-logo-stacked.svg',
        routerLink: '/manage/thirdparty_app/payrollcheck',
        styles: { display: 'flex', flex: 'none', img: { width: '122px' } },
        id: 'qb-payroll'
      },
      {
        title: 'Zoho Payroll',
        icon: '../../../../assets/images/integration/payroll-latest-logo.png',
        routerLink: '/manage/thirdparty_app/zoho/zoho_payroll',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'Zoho-payroll'
      },
      {
        title: 'Gusto',
        icon: '../../../../assets/images/integration/gusto-latest-logo.png',
        routerLink: '/manage/thirdparty_app/gusto',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'gusto'
      },
      {
        title: 'Use Credit Card to Pay Payroll',
        icon: '../../../../assets/images/integration/adp-logo1.png',
        routerLink: '/manage/thirdparty_app/adp/adp-view',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'adp'
      },
      {
        title: 'Square',
        icon: '/assets/images/integration/square.webp',
        routerLink: '/manage/thirdparty_app/square',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        id: 'square',
      },
      {
        title: 'Workday',
        icon: '../../../../assets/images/integration/workday.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'workday'
      },
      {
        title: 'Paylocity',
        icon: '../../../../assets/images/integration/paylocity.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'paylocity'
      },
      {
        title: 'Deel',
        icon: '../../../../assets/images/integration/deel.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'deel'
      },
      {
        title: 'Factorial',
        icon: '../../../../assets/images/integration/factorial.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'factorial'
      },
      {
        title: 'Paychex',
        icon: '../../../../assets/images/integration/paychex.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'paychex'
      },
      {
        title: 'Proliant',
        icon: '../../../../assets/images/integration/proliant.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'proliant'
      },
      {
        title: 'Rippling',
        icon: '../../../../assets/images/integration/rippling.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'rippling'
      },
      {
        title: 'SAP Success Factors',
        icon: '../../../../assets/images/integration/sap-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '80px' } },
        comingSoon: true,
        id: 'sapsuccess'
      },
      {
        title: 'Trinet',
        icon: '../../../../assets/images/integration/trinet.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'trinet'
      },
      {
        title: 'UKG Pro',
        icon: '../../../../assets/images/integration/ukgpro.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'ukgpro'
      },
      {
        title: 'UKG Ready',
        icon: '../../../../assets/images/integration/ukg.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'ukgredy'
      },
      {
        title: 'BambooHR',
        icon: '../../../../assets/images/integration/bamboo.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'bambooHr'
      },
      {
        title: 'Justworks',
        icon: '../../../../assets/images/integration/justwork.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'justworks'
      },
      {
        title: 'Hibob',
        icon: '../../../../assets/images/integration/bob.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'hibob'
      },
      {
        title: 'Okta',
        icon: '../../../../assets/images/integration/okta.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'okta'
      },
      {
        title: 'Azure Active Directory',
        icon: '../../../../assets/images/integration/azure.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'azureactive'
      },
    ];
  }

  static ticketingLinks() {
    return [
      {
        title: 'Asana',
        icon: '../../../../assets/images/integration/asana.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'asana'
      },
      {
        title: 'Jira',
        icon: '../../../../assets/images/integration/jira.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jira'
      },
      {
        title: 'Zendesk',
        icon: '../../../../assets/images/integration/zendesk.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'zendesk'
      },
      {
        title: 'Intercom',
        icon: '../../../../assets/images/integration/intercom.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'intercom'
      },
      {
        title: 'Service Now',
        icon: '../../../../assets/images/integration/service.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'serviceNow'
      },
      {
        title: 'Azure DevOps',
        icon: '../../../../assets/images/integration/azuredev.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'azureDevops'
      },
      {
        title: 'Freshdesk',
        icon: '../../../../assets/images/integration/fresh.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'freshdesk'
      },
      {
        title: 'Ironclad',
        icon: '../../../../assets/images/integration/iron.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'ironClad'
      },
      {
        title: 'Jira Service Management',
        icon: '../../../../assets/images/integration/jiraservice.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jiraserviceManagement'
      },
      {
        title: 'Linear',
        icon: '../../../../assets/images/integration/linear.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'linear'
      },
      {
        title: 'Salesforce Service Cloud',
        icon: '../../../../assets/images/integration/salesforce.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '60px' } },
        comingSoon: true,
        id: 'salesforce'
      },
      {
        title: 'Zoho Desk',
        icon: '../../../../assets/images/integration/zohodesk.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'zohodesk'
      }
    ];
  }

  static crmLinks() {
    return [
      {
        title: 'Salesforce',
        icon: '../../../../assets/images/integration/salesforce.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'salesforce'
      },
      {
        title: 'Hubspot',
        icon: '../../../../assets/images/integration/hub.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'hubspot'
      },
      {
        title: 'Jobber',
        icon: '../../../../assets/images/integration/jobber.svg',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jobber'
      },
      {
        title: 'Pipedrive',
        icon: '../../../../assets/images/integration/pipe.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'pipedrive'
      },
      {
        title: 'Microsoft Dynamics 365 Sales',
        icon: '../../../../assets/images/integration/microsoft-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'microsoftDynamics'
      },
      {
        title: 'Zendesk Sell',
        icon: '../../../../assets/images/integration/zendesk-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'zendeskSell'
      },
      {
        title: 'Zoho CRM',
        icon: '../../../../assets/images/integration/zohocrm.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'zohocrm'
      },
      {
        title: 'Copper',
        icon: '../../../../assets/images/integration/copper.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'copper'
      },
      {
        title: 'Keap',
        icon: '../../../../assets/images/integration/keap.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'keap'
      },
      {
        title: 'Teamwork CRM',
        icon: '../../../../assets/images/integration/teamwork.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'teamwork'
      },
      {
        title: 'Fresh Sales',
        icon: '../../../../assets/images/integration/freshsales.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'freshSales'
      },
      {
        title: 'Active Campaign',
        icon: '../../../../assets/images/integration/active.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'activeCampaign'
      },
      {
        title: 'Capsule',
        icon: '../../../../assets/images/integration/capsule.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'capsule'
      }
    ];
  }

  static marketingLinks() {
    return [
      {
        title: 'Active Campaign',
        icon: '../../../../assets/images/integration/active.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'activeCampaign'
      },
      {
        title: 'Customer.io',
        icon: '../../../../assets/images/integration/customer.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'customer'
      },
      {
        title: 'Hubspot Marketing Hub',
        icon: '../../../../assets/images/integration/hub.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'hubspot_marketing'
      },
      {
        title: 'Keap',
        icon: '../../../../assets/images/integration/keap.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'keap'
      },
      {
        title: 'Klaviyo',
        icon: '../../../../assets/images/integration/klavio.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'klaviyo'
      },
      {
        title: 'Mailchimp',
        icon: '../../../../assets/images/integration/mailchimp.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'mailChimp'
      },
      {
        title: 'Message Bird',
        icon: '../../../../assets/images/integration/messagebird.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'messageBird'
      },
      {
        title: 'Podium',
        icon: '../../../../assets/images/integration/podium.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'podium'
      },
      {
        title: 'Sendinblue',
        icon: '../../../../assets/images/integration/sendinblue.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'sendinblue'
      },
      {
        title: 'Get Response',
        icon: '../../../../assets/images/integration/response.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'getResponse'
      }
    ];
  }

  static atsLinks() {
    return [
      {
        title: 'Workday',
        icon: '../../../../assets/images/integration/workday.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'workday'
      },
      {
        title: 'Greenhouse',
        icon: '../../../../assets/images/integration/green.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'greenhouse'
      },
      {
        title: 'Lever',
        icon: '../../../../assets/images/integration/lever.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'lever'
      },
      {
        title: 'Jobvite',
        icon: '../../../../assets/images/integration/jobvite.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'jobvite'
      },
      {
        title: 'ICIMS',
        icon: '../../../../assets/images/integration/icims.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'icims'
      },
      {
        title: 'Oracle Taleo',
        icon: '../../../../assets/images/integration/oracle.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'oracleTaleo'
      },
      {
        title: 'Smart Recruiters',
        icon: '../../../../assets/images/integration/smart.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'smartRecruiters'
      },
      {
        title: 'Cornerstone Talentlink',
        icon: '../../../../assets/images/integration/corner.png',
        routerLink: '',
        styles: {
          display: 'flex',
          flex: 'none',
          img: { width: '120px', height: '45px' }
        },
        comingSoon: true,
        id: 'cornerstone'
      },
      {
        title: 'Talent Reef',
        icon: '../../../../assets/images/integration/talent.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'talentReef'
      },
      {
        title: 'Workable',
        icon: '../../../../assets/images/integration/workable.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '90px' } },
        comingSoon: true,
        id: 'workable'
      },
      {
        title: 'Ashby',
        icon: '../../../../assets/images/integration/ashby.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '100px' } },
        comingSoon: true,
        id: 'ashby'
      },
      {
        title: 'SAP Success Factors',
        icon: '../../../../assets/images/integration/sap-new.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '80px' } },
        comingSoon: true,
        id: 'sapsuccess'
      }
    ];
  }

  static otherLinks() {
    return [
      {
        title: 'Zapier',
        icon: '../../../../assets/images/integration/zapier-latest-logo.png',
        routerLink: '/manage/thirdparty_app/zapier',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'zapier'
      },
      {
        title: 'Create Check from PDF ',
        icon: '../../../../assets/icon/pdf.svg',
        routerLink: '/manage/thirdparty_app/payrollcheck',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        id: 'check-from-pdf'
      },
      {
        title: 'Exact',
        icon: '../../../../assets/images/integration/exact.png',
        routerLink: '',
        styles: { display: 'flex', flex: 'none', img: { width: '70px' } },
        comingSoon: true,
        id: 'exact'
      }
    ];
  }

  static thirdPartyImportData() {
    return [
      {
        name: 'QuickBooks Online',
        image: '/assets/images/integration/qb-logo-stacked.svg',
        width: 'w-[50px]',
        height: 'h-[30px]'
      },
      {
        name: 'QuickBooks Desktop',
        image: '/assets/images/integration/qb-logo-stacked.svg',
        width: 'w-[50px]',
        height: 'h-[30px]'
      },
      {
        name: 'Gusto',
        image: '/assets/images/integration/gusto-logo-vector.svg',
        width: 'w-[34px]',
        height: 'h-[36px]'
      },
      {
        name: 'Sage Business Cloud Accounting',
        image: '/assets/images/integration/Sage_logo.svg',
        width: 'w-[30px]',
        height: 'h-[38px]'
      },
      {
        name: 'Zoho Book',
        image: '/assets/images/integration/zoho-latest-logo.png',
        width: 'w-[25px]',
        height: 'h-[25px]'
      },
      {
        name: 'NetSuite',
        image: '/assets/images/integration/oracle-netsuite.png',
        width: 'w-[50px]',
        height: 'h-[30px]'
      }
    ];
  }
}
