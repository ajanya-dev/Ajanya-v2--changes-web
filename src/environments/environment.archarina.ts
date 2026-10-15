import { IEnvironment } from 'src/app/models/environment';

export const environment: IEnvironment = {
  production: true,
  isItDev: false,
  isItWhiteLabel: true,
  env_id: 'archarina',
  productName: 'Archarina',

  rootUrl: 'https://api.archarina.io/api/v4',
  mailMasterUrl: 'https://mm-master.zilmoney.com/api/v1',
  PERSONA_TEMPLATE_ID: 'tmpl_YMgY24tSDtcCexyvwMzjULcb',
  PERSONA_ENVIRONMENT: 'production',
  ocwapiurl: 'https://ocwapi.com',
  VGS_VAULT_ID: 'tntbevlgikb',
  VGS_ENVIRONMENT: 'live',
  GOOGLE_API: 'AIzaSyD72D7OVWyyosrfJtFBSFakwL21PWDoF8w',
  pusher: { key: '87fb14aa697526f9a1c7', cluster: 'mt1' },

  support_email: '',
  support_website: '',

  from_email: '',
  terms_and_conditions: 'https://www.archarina.io/documentation',
  website: '',
  help_website: '',
  payment_short_link: '',
  cloud_bank: {
    terms_and_conditions: 'https://www.archarina.io/documentation'
  },
  version: '3.5.0',
  isV4Persona: true,
};
