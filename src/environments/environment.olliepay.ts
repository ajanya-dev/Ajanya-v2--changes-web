import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  socialLoginVisible: false,
  env_id: 'olliepay',
  productName: 'OlliePay',

  rootUrl: 'https://api.olliepay.ai/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'http://ocwapi.yodlee.test',
  support_email: 'support@olliepay.ai',
  support_phone_number: '(617) 955 6192',
  help_website: 'https://help.olliepay.com',

  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },
  terms_and_conditions: 'https://zilmoney.com/terms-and-condition',
  version: '3.5.0 ',
};
