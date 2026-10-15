import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  socialLoginVisible: false,
  env_id: 'buckzy-sandbox',
  productName: 'Buckzy',

  rootUrl: 'https://api.sandbox.buckzy.zilmoney.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'http://ocwapi.yodlee.test',

  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'sandbox',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'sandbox',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },
  terms_and_conditions: 'https://buckzy.net/terms-and-conditions-us-retail',
  version: '3.5.0 ',
};
