import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: true,
  isItWhiteLabel: false,
  env_id: 'staging',
  productName: 'Online Check Writer',
  rootUrl: 'https://staging.api.ocw.sebipay.com/api/v4',
  mailMasterUrl: 'https://mm-app.sebipay.com/api/v1',
  ocwapiurl: 'https://staging-ocwapi.sebipay.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'sandbox',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'sandbox',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '32fdd4025c382e054d1d', cluster: 'mt1' },
  version: '3.5.0',
  isV4Persona: true,
  loomPublicId: '06fb53cd-fc76-4694-87af-dfe24cd1270e',
  ocw_trackers: {
    googleTagManager: { enabled: true, data: { key: 'GTM-M5ZCFHK7' } },
  },
  website: 'https://zilmoney.com/',
  support_email: 'support@zilmoney.com',
  providerType:'zilmoney'
};
