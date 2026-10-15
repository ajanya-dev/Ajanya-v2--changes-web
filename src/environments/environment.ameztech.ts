import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  env_id: 'ameztech',
  productName: 'Ameztech',

  rootUrl: 'https://api.ameztech.zilmoney.com/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',

  ocwapiurl: 'https://ocwapi.com',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },

  support_email: 'noreply@ameztech.ca',
  support_website: 'https://help.ameztech.ca',

  from_email: 'noreply@ameztech.ca',
  terms_and_conditions: 'https://www.ameztech.ca/legal',
  website: 'https://www.ameztech.ca',
  help_website: 'https://help.ameztech.ca',
  payment_short_link: 'https://pay.ameztech.ca',
  cloud_bank: {
    terms_and_conditions: 'https://www.ameztech.ca/legal'
  },
  version: '3.5.0',
};
