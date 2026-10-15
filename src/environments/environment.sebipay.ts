import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: false,
  env_id: 'sebipay',
  productName: 'Online Check Writer',

  rootUrl: 'https://api.sebipay.com/api/v4',
  mailMasterUrl: 'https://mm-app.sebipay.com/api/v1',

  ocwapiurl: 'https://ocwapi.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  VGS_VAULT_ID: 'tntpsikpeyn',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },
  version: '3.5.0',
};
