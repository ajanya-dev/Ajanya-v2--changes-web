import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  socialLoginVisible: false,

  env_id: 'quickbanked',
  productName: 'QuickBanked',

  rootUrl: 'https://api.app.quickbanked.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'https://ocwapi.com',

  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  VGS_VAULT_ID: 'tntpsikpeyn',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',

  // zoho__support_chat: 'https://salesiq.zoho.com/signaturesupport.ls?widgetcode=efc528fbaaa487292174257ea69a6e8d92656d1d2f3a1eb8dae3baaa8902aa41',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },

  website: 'https://quickbanked.com',

  support_phone_number: '',
  support_email: 'support@quickbanked.com',
  support_website: 'https://quickbanked.com/contact-us.html',

  from_email: 'noreply@quickbanked.com',
  terms_and_conditions: 'https://www.quickbanked.com/legal',
  help_website: 'https://quickbanked.com/contact-us.html',
  payment_short_link: 'https://pay.quickbanked.com',
  api_documentation: 'https://developers.quickbanked.com',
  cloud_bank: {
    id: 'cloudBank',
    label: 'cloud bank',
    terms_and_conditions: 'https://www.quickbanked.com/legal'
  },

  subscriptionVisible: false,
  version: '3.5.0',
};
