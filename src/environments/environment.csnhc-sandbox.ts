import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  env_id: 'csnhc',
  productName: 'CSNHC',

  rootUrl: 'https://app.csnhc-sandbox.zilmoney.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'https://ocwapi.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'sandbox',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'sandbox',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },
  version: '3.5.0',
};
