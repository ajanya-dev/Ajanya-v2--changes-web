import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  socialLoginVisible: false,
  env_id: 'quickbanked-sandbox',
  productName: 'QuickBanked',

  rootUrl: 'https://api.sandbox.quickbanked.zilmoney.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'http://ocwapi.yodlee.test',

  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'sandbox',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'sandbox',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },
  subscriptionVisible: false,
  version: '3.5.0',
  website: 'https://quickbanked.com',
  support_phone_number: '',
  support_email: 'support@quickbanked.com',
  support_website: 'https://quickbanked.com/contact-us.html',
  from_email: 'noreply@quickbanked.com',
  terms_and_conditions: 'https://www.quickbanked.com/legal',
  help_website: 'https://quickbanked.com/contact-us.html',
};
