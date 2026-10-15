import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: false,
  isItDev: true,
  isItWhiteLabel: false,
  env_id: 'staging_dev',
  productName: 'Online Check Writer',
  rootUrl: 'https://staging.api.ocw.sebipay.com/api/v4',
  mailMasterUrl: 'https://mm-app.sebipay.com/api/v1',

  website: 'https://onlinecheckwriter.com',
  ocwapiurl: 'https://staging-ocwapi.sebipay.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'sandbox',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'sandbox',
  GOOGLE_API: 'AIzaSyAhel4MGFqaDtL24pY9d8ZTEPR2OqjGT7I',
  pusher: { key: '32fdd4025c382e054d1d', cluster: 'mt1' },
  support_email: 'support@onlinecheckwriter.com',
  version: '3.5.0',
  isV4Persona: true,
  loomPublicId: '0689ff4f-e7b4-4d8a-9a46-7bae9b9cdef7',
  providerType:'regular'
};
